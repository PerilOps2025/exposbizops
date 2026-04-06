import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
      return new Response("Missing code or state", { status: 400 });
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokens);
      return new Response("Token exchange failed: " + JSON.stringify(tokens), { status: 400 });
    }

    // Get user email from Google
    let calendarEmail: string | null = null;
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();
      calendarEmail = userInfo.email || null;
    } catch (_) { /* optional */ }

    // Store tokens
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    const { error } = await supabase.from("calendar_tokens").upsert({
      user_id: userId,
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      calendar_email: calendarEmail,
    }, { onConflict: "user_id,provider" });

    if (error) {
      console.error("Failed to store tokens:", error);
      return new Response("Failed to store tokens", { status: 500 });
    }

    // Redirect back to app
    const appUrl = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".lovable.app").replace("https://", "https://id-preview--");
    // Use a simple success page that closes or redirects
    return new Response(
      `<html><body><script>window.opener ? window.close() : window.location.href = '/';</script><p>Calendar connected! You can close this window.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    console.error("google-calendar-callback error:", e);
    return new Response("Error: " + (e instanceof Error ? e.message : "Unknown"), { status: 500 });
  }
});
