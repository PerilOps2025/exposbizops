# Project Memory

## Core
ExPOS - Executive Personal OS. Single-user voice-first task/decision tracker.
Lovable Cloud backend with 9 tables. AI parsing via Lovable AI gateway.
Clean light theme, primary blue #3B82F6. Inter font.
Google Calendar integration via OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET secrets).

## Memories
- [Database schema](mem://features/database) — 9 tables: master_log, inbox, active_tasks, decisions, meeting_log, archive, config, task_audit, calendar_tokens
- [AI parsing](mem://features/ai-parsing) — Edge function parse-transcript using Lovable AI to extract tasks/decisions/events from voice
- [Dashboard views](mem://features/dashboard) — 5 views: Pulse, Team Follow-up, Decision Feed, Upcoming Tasks, Team/Person Load
- [Google Calendar](mem://features/google-calendar) — OAuth flow via 3 edge functions, Pre-Meeting Brief with related tasks/decisions/past meetings
