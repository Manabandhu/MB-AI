-- Push delivery uses the Expo push service. device_registrations (V13) was never written to, so it becomes the
-- token store: one row per device token (a token moves to whoever signs in on that device last).
DELETE FROM public.device_registrations d
USING public.device_registrations newer
WHERE d.device_token = newer.device_token
  AND (d.created_at, d.id) < (newer.created_at, newer.id);

CREATE UNIQUE INDEX IF NOT EXISTS device_registrations_token_key ON public.device_registrations (device_token);
CREATE INDEX IF NOT EXISTS device_registrations_user_idx ON public.device_registrations (user_id) WHERE enabled;

-- Inbox paging reads the newest notifications per user.
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.device_registrations FROM anon, authenticated;
    END IF;
END $$;
