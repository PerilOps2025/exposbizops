import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are an expert executive assistant AI that parses voice transcripts into structured items.

ENTITY EXTRACTION RULES:
- Person: Names NOT followed by the word 'team'. e.g. Jaya, Kishore, Rajan
- Team/Department: Names followed by 'team'. e.g. 'Procurement team', 'Prolance team'
- Project: Named initiatives without 'team'. e.g. 'Finance app', 'Prolance tool'
- Email: Extract any email addresses mentioned (e.g. john@example.com). Associate them with CalendarEvent items as attendees.

CLASSIFICATION:
- Task: Action items someone needs to do
- Decision: Conclusions or choices made
- CalendarEvent: Scheduled meetings or events with explicit time references. Extract attendee emails if mentioned.

PRIORITY INFERENCE:
- High: urgent, ASAP, critical, immediately, escalate
- Med: follow up, check, review, soon
- Low: when possible, eventually, nice to have

SPECIAL TRIGGERS:
- 'remind me this for next meeting' → is_meeting_context = true
- 'only after X is done', 'once X is done' → blocked_by_description
- Vague dates like 'next week', 'soon' → due_is_vague = true

OUTPUT: Return ONLY valid JSON matching this schema exactly:
{
  "items": [
    {
      "type": "Task | Decision | CalendarEvent",
      "text": "parsed task/decision text",
      "person": ["name1"],
      "person_is_new": false,
      "team": "team name or null",
      "team_is_new": false,
      "project_tag": "project name or null",
      "priority": "High | Med | Low",
      "due_date": "YYYY-MM-DD or null",
      "due_time": "HH:MM or null",
      "due_is_vague": false,
      "is_meeting_context": false,
      "invite_person": false,
      "calendar_event_title": "null or title for the calendar event",
      "email": ["attendee@example.com"],
      "blocked_by_description": "null or description",
      "raw_fragment": "portion of original transcript",
      "linked_meeting_team": "team name if transcript says 'for the next meeting with X team' or 'for the X team meeting', null otherwise",
      "linked_meeting_title_hint": "meeting title hint if transcript says 'for the next meeting' or 'discuss in the ABC meeting', null otherwise"
    }
  ]
}

No preamble, no markdown, no explanation. ONLY the JSON object.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, masterLogId } = await req.json();
    if (!transcript) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
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

    // Load entity context from config
    let entityContext = "";
    const { data: configData } = await supabase
      .from("config")
      .select("key, value")
      .eq("user_id", userId)
      .in("key", ["ENTITY_PEOPLE", "ENTITY_TEAMS", "ENTITY_PROJECTS", "GEMINI_FEW_SHOT_EXAMPLES"]);

    if (configData) {
      const configMap: Record<string, any> = {};
      configData.forEach((c: any) => { configMap[c.key] = c.value; });

      if (configMap.ENTITY_PEOPLE) {
        entityContext += `\nKNOWN PEOPLE: ${JSON.stringify(configMap.ENTITY_PEOPLE)}`;
      }
      if (configMap.ENTITY_TEAMS) {
        entityContext += `\nKNOWN TEAMS: ${JSON.stringify(configMap.ENTITY_TEAMS)}`;
      }
      if (configMap.ENTITY_PROJECTS) {
        entityContext += `\nKNOWN PROJECTS: ${JSON.stringify(configMap.ENTITY_PROJECTS)}`;
      }
      if (configMap.GEMINI_FEW_SHOT_EXAMPLES) {
        entityContext += `\nCORRECTION EXAMPLES: ${JSON.stringify(configMap.GEMINI_FEW_SHOT_EXAMPLES)}`;
      }
    }

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + entityContext + `\n\nTODAY'S DATE: ${new Date().toISOString().split("T")[0]} (use this to resolve relative dates like 'tomorrow', 'next Monday', etc.)` },
          { role: "user", content: `Parse this voice transcript:\n\n"${transcript}"` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error: " + response.status);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    const tokensUsed = aiResult.usage?.total_tokens || 0;

    // Track AI usage
    const todayKey = new Date().toISOString().split("T")[0];
    const { data: usageData } = await supabase
      .from("config")
      .select("value")
      .eq("user_id", userId)
      .eq("key", "AI_USAGE")
      .single();

    const usage = (usageData?.value as any) || {};
    const todayUsage = usage[todayKey] || { calls: 0, tokens: 0 };
    todayUsage.calls += 1;
    todayUsage.tokens += tokensUsed;
    usage[todayKey] = todayUsage;

    await supabase.from("config").upsert(
      { user_id: userId, key: "AI_USAGE", value: usage },
      { onConflict: "user_id,key" }
    );

    // Parse JSON from AI response
    let parsed;
    try {
      // Handle potential markdown wrapping
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid JSON");
    }

    const items = parsed.items || [];

    // Try to auto-link meetings based on AI hints
    const meetingLinkCache: Record<string, string | null> = {};
    const findMeetingId = async (teamHint: string | null, titleHint: string | null): Promise<string | null> => {
      const key = `${teamHint}|${titleHint}`;
      if (key in meetingLinkCache) return meetingLinkCache[key];
      
      let meetingId: string | null = null;
      if (teamHint) {
        const { data } = await supabase
          .from("meeting_log")
          .select("meeting_id")
          .contains("teams", [teamHint])
          .order("scheduled_start", { ascending: true })
          .limit(1);
        if (data?.[0]) meetingId = data[0].meeting_id;
      }
      if (!meetingId && titleHint) {
        const { data } = await supabase
          .from("meeting_log")
          .select("meeting_id")
          .ilike("meeting_title", `%${titleHint}%`)
          .order("scheduled_start", { ascending: true })
          .limit(1);
        if (data?.[0]) meetingId = data[0].meeting_id;
      }
      meetingLinkCache[key] = meetingId;
      return meetingId;
    };

    // Write to INBOX
    const inboxRows = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Auto-link meeting
      let linkedMeetingId: string | null = null;
      if (item.linked_meeting_team || item.linked_meeting_title_hint) {
        linkedMeetingId = await findMeetingId(item.linked_meeting_team, item.linked_meeting_title_hint);
      }

      // Generate inbox ID using timestamp+random for uniqueness
      const ts = Date.now().toString(36);
      const rand = Math.random().toString(36).substring(2, 6);
      const inboxId = `INB-${ts}-${rand}`;

      const row = {
        inbox_id: inboxId,
        user_id: userId,
        master_log_ref: masterLogId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(masterLogId) ? masterLogId : null,
        type: item.type || "Task",
        raw_fragment: item.raw_fragment || null,
        parsed_text: item.text || "",
        person: item.person || [],
        person_is_new: item.person_is_new || false,
        person_collision: item.person_collision || false,
        team: item.team || null,
        team_is_new: item.team_is_new || false,
        project_tag: item.project_tag || null,
        priority: item.priority || "Med",
        due_date: item.due_date || null,
        due_time: item.due_time || null,
        due_is_vague: item.due_is_vague || false,
        is_meeting_context: item.is_meeting_context || false,
        invite_person: item.invite_person || false,
        calendar_event_title: item.calendar_event_title || null,
        email: item.email || [],
        blocked_by_desc: item.blocked_by_description || null,
        linked_meeting_id: linkedMeetingId,
        status: "Pending",
      };

      const { error } = await supabase.from("inbox").insert(row);
      if (error) {
        console.error("Failed to insert inbox item:", error);
      } else {
        inboxRows.push({ ...row, inbox_id: inboxId });
      }
    }

    return new Response(JSON.stringify({ items: inboxRows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-transcript error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
