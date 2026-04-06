CREATE TABLE public.calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendar_tokens"
  ON public.calendar_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_calendar_tokens_updated_at
  BEFORE UPDATE ON public.calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();