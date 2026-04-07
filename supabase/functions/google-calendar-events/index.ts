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

    // Get stored tokens
    const { data: tokenRow } = await supabase
      .from("calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    if (!tokenRow) {
      return new Response(JSON.stringify({ error: "Calendar not connected", connected: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await refreshTokenIfNeeded(supabase, tokenRow);

    // Fetch upcoming events (next 7 days)
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const calParams = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: weekLater.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
      conferenceDataVersion: "1",
    });

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calParams.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calRes.ok) {
      const errText = await calRes.text();
      console.error("Calendar API error:", calRes.status, errText);
      throw new Error("Calendar API error: " + calRes.status);
    }

    const calData = await calRes.json();
    const events = (calData.items || []).map((e: any) => ({
      id: e.id,
      title: e.summary || "No Title",
      description: e.description || null,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      attendees: (e.attendees || []).map((a: any) => ({
        email: a.email,
        name: a.displayName || a.email,
        responseStatus: a.responseStatus,
      })),
      location: e.location || null,
      htmlLink: e.htmlLink,
      meetLink: e.hangoutLink || e.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri || null,
    }));

    return new Response(JSON.stringify({
      connected: true,
      email: tokenRow.calendar_email,
      events,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("google-calendar-events error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
