-- Track push delivery attempts so permanently failing notifications back off and eventually stop being claimed,
-- instead of pinning the oldest-first dispatch batch forever.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dispatch_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS next_dispatch_at timestamptz;
