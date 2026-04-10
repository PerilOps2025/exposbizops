
ALTER TABLE public.active_tasks ADD COLUMN linked_meeting_id text DEFAULT NULL;
ALTER TABLE public.archive ADD COLUMN linked_meeting_id text DEFAULT NULL;
ALTER TABLE public.inbox ADD COLUMN linked_meeting_id text DEFAULT NULL;
