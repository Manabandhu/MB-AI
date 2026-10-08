-- V29: security hardening.
-- 1. Lock down tables V28 created without row level security (they were readable and writable by anyone
--    holding the public Supabase key through PostgREST). The backend connects as the table owner and is
--    unaffected; clients must go through the API.
-- 2. Per-user notification settings (previously one in-memory map shared by every user).
-- 3. Backfill expense group owners as members so membership checks include existing groups.
-- 4. Pin search_path on the SECURITY DEFINER purge function and stop it re-updating already-purged rides.
-- 5. Let chat participants (and only them) receive realtime inserts on public.messages.
-- 6. Store ride statuses lowercase and allow in_progress.
-- 7. Make referrals.recipient_id optional so referrals can be created before anyone responds.
-- 8. Add ride bookmarks (ride_favorites).
-- 9. Add an admin audit log.

-- 1. Row level security for V28 tables -------------------------------------------------------------
ALTER TABLE IF EXISTS public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expense_group_members ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    target text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        FOREACH target IN ARRAY ARRAY['chat_conversations', 'chat_participants', 'chat_messages',
                                      'community_members', 'expense_group_members'] LOOP
            IF to_regclass('public.' || target) IS NOT NULL THEN
                EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', target);
            END IF;
        END LOOP;
    END IF;
END $$;

-- 2. Notification settings --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id uuid PRIMARY KEY,
    preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.notification_settings FROM anon, authenticated;
    END IF;
END $$;

-- 3. Expense group membership backfill --------------------------------------------------------------
INSERT INTO public.expense_group_members (group_id, user_id)
SELECT id, owner_id FROM public.expense_groups WHERE owner_id IS NOT NULL
ON CONFLICT (group_id, user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS expense_group_members_user_idx ON public.expense_group_members (user_id);
CREATE INDEX IF NOT EXISTS community_members_user_idx ON public.community_members (user_id);
CREATE INDEX IF NOT EXISTS settlements_from_user_idx ON public.settlements (from_user_id);
CREATE INDEX IF NOT EXISTS settlements_to_user_idx ON public.settlements (to_user_id);
CREATE INDEX IF NOT EXISTS notifications_undispatched_idx ON public.notifications (created_at) WHERE dispatched = false;

-- 4. Ride chat purge ----------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_expired_ride_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Participants and messages cascade from conversations.
    DELETE FROM public.conversations
    WHERE id IN (
        SELECT conversation_id FROM public.ride_offers
        WHERE conversation_id IS NOT NULL AND chat_expires_at IS NOT NULL AND chat_expires_at <= NOW()
    );

    UPDATE public.ride_offers
    SET conversation_id = NULL
    WHERE conversation_id IS NOT NULL AND chat_expires_at IS NOT NULL AND chat_expires_at <= NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_ride_chats() FROM PUBLIC;

-- 5. Realtime chat for participants ----------------------------------------------------------------
-- Supabase-only pieces (auth.uid(), the realtime schema, the supabase_realtime publication) are guarded so
-- this migration also runs on a plain Postgres used for local development and tests.
DO $$
BEGIN
    IF to_regprocedure('auth.uid()') IS NULL THEN
        RAISE NOTICE 'auth.uid() not found; skipping Supabase realtime chat policies';
        RETURN;
    END IF;

    EXECUTE $fn$
        CREATE OR REPLACE FUNCTION public.is_conversation_participant(target_conversation uuid)
        RETURNS boolean
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        SET search_path = public, pg_temp
        AS $body$
            SELECT EXISTS (
                SELECT 1 FROM public.conversation_participants
                WHERE conversation_id = target_conversation
                  AND user_id = auth.uid()
                  AND left_at IS NULL
            );
        $body$
    $fn$;
    REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated;

    -- Participants may read their own conversations' messages; writes still go through the API.
    GRANT SELECT ON TABLE public.messages TO authenticated;
    DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
    CREATE POLICY "Participants read messages" ON public.messages
        FOR SELECT TO authenticated
        USING (public.is_conversation_participant(conversation_id));

    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Private broadcast channels named conversation:<id> (typing indicators) are limited to participants.
    IF to_regclass('realtime.messages') IS NOT NULL AND to_regprocedure('realtime.topic()') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Participants use conversation channels" ON realtime.messages;
        CREATE POLICY "Participants use conversation channels" ON realtime.messages
            FOR ALL TO authenticated
            USING (
                realtime.topic() LIKE 'conversation:%'
                AND public.is_conversation_participant(NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid)
            )
            WITH CHECK (
                realtime.topic() LIKE 'conversation:%'
                AND public.is_conversation_participant(NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid)
            );
    END IF;
END $$;

-- 6. Ride statuses ------------------------------------------------------------------------------------
-- Code previously wrote uppercase offer statuses ('ACTIVE', 'IN_PROGRESS', ...) that the V3 constraint
-- rejects, so ride creation failed on databases created by these migrations. Store lowercase everywhere
-- and allow the in-progress state the trip lifecycle uses.
ALTER TABLE public.ride_offers DROP CONSTRAINT IF EXISTS ride_offers_status_valid;
UPDATE public.ride_offers SET status = lower(status) WHERE status <> lower(status);
UPDATE public.ride_offers SET status = 'active' WHERE status NOT IN ('draft', 'active', 'in_progress', 'completed', 'cancelled');
ALTER TABLE public.ride_offers
    ADD CONSTRAINT ride_offers_status_valid CHECK (status IN ('draft', 'active', 'in_progress', 'completed', 'cancelled'));

UPDATE public.ride_requests SET status = lower(status) WHERE status <> lower(status);
UPDATE public.ride_bookings SET status = lower(status) WHERE status <> lower(status);

-- 7. Referrals -----------------------------------------------------------------------------------------
-- A referral request or offer has no recipient until someone responds. The API used to insert a random UUID,
-- which the auth.users foreign key rejects, so creating referrals always failed.
ALTER TABLE public.referrals ALTER COLUMN recipient_id DROP NOT NULL;

-- 8. Ride bookmarks -------------------------------------------------------------------------------------
-- The app's "save ride" button called endpoints that did not exist; bookmarks now have a home.
CREATE TABLE IF NOT EXISTS public.ride_favorites (
    ride_id uuid NOT NULL REFERENCES public.ride_offers(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (ride_id, user_id)
);
CREATE INDEX IF NOT EXISTS ride_favorites_user_idx ON public.ride_favorites (user_id, created_at DESC);
ALTER TABLE public.ride_favorites ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.ride_favorites FROM anon, authenticated;
    END IF;
END $$;

-- 9. Admin audit log -----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor varchar(100) NOT NULL,
    action varchar(100) NOT NULL,
    target_type varchar(50),
    target_id varchar(100),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.admin_audit_log FROM anon, authenticated;
    END IF;
END $$;
