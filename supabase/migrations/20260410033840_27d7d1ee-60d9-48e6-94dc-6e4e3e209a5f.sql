
ALTER TABLE public.decisions ADD COLUMN valid_until date DEFAULT NULL;
ALTER TABLE public.decisions ADD COLUMN is_active boolean NOT NULL DEFAULT true;
