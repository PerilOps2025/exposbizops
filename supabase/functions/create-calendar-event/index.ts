import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshTokenIfNeeded(
  supabase: any,
  tokenRow: any
): Promise<string> {
  if (new Date(tokenRow.expires_at) > new Date(Date.now() + 60_000)) {
    return tokenRow.access_token;
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenRow.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Token refresh failed: " + JSON.stringify(data));

  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

  await supabase.from("calendar_tokens").update({
    access_token: data.access_token,
    expires_at: expiresAt,
  }).eq("id", tokenRow.id);

  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, description, startDate, startTime, endDate, endTime, attendeeEmails, addMeetLink } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get stored tokens
    const { data: tokenRow } = await supabase
      .from("calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    if (!tokenRow) {
      return new Response(JSON.stringify({ error: "Calendar not connected. Please connect Google Calendar first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await refreshTokenIfNeeded(supabase, tokenRow);

    // Build event payload
    const isAllDay = !startTime;

    let eventBody: any = {
      summary: title,
      description: description || undefined,
      attendees: (attendeeEmails || []).map((email: string) => ({ email })),
    };

    // Only add conference data if Meet link is requested
    const wantMeet = addMeetLink !== false; // default true
    if (wantMeet) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    if (isAllDay) {
      // All-day event
      const date = startDate || new Date().toISOString().split("T")[0];
      const end = endDate || date;
      // For all-day events, end date is exclusive, so add 1 day
      const endExclusive = new Date(end);
      endExclusive.setDate(endExclusive.getDate() + 1);
      eventBody.start = { date };
      eventBody.end = { date: endExclusive.toISOString().split("T")[0] };
    } else {
      // Timed event
      const date = startDate || new Date().toISOString().split("T")[0];
      const sTime = startTime || "09:00";
      const eTime = endTime || (() => {
        const [h, m] = sTime.split(":").map(Number);
        return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      })();
      const eDate = endDate || date;

      // Use the user's timezone from the calendar settings, default to UTC
      const timeZone = "Asia/Kolkata"; // Default for this app

      eventBody.start = { dateTime: `${date}T${sTime}:00`, timeZone };
      eventBody.end = { dateTime: `${eDate}T${eTime}:00`, timeZone };
    }

    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!calRes.ok) {
      const errText = await calRes.text();
      console.error("Google Calendar create error:", calRes.status, errText);
      throw new Error("Failed to create calendar event: " + calRes.status);
    }

    const created = await calRes.json();

    return new Response(JSON.stringify({
      success: true,
      eventId: created.id,
      htmlLink: created.htmlLink,
      meetLink: created.hangoutLink || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-calendar-event error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
