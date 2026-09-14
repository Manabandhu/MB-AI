-- 1. Enhance ride_offers table
ALTER TABLE public.ride_offers
    ADD COLUMN IF NOT EXISTS origin_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS origin_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS route_polyline TEXT,
    ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS estimated_duration_mins INT,
    ADD COLUMN IF NOT EXISTS toll_preference VARCHAR(30) DEFAULT 'AVOID_TOLLS', -- 'AVOID_TOLLS', 'TOLLS_INCLUDED', 'TOLLS_SPLIT'
    ADD COLUMN IF NOT EXISTS estimated_toll_amount NUMERIC(6,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(30) DEFAULT 'ONE_TIME', -- 'ONE_TIME', 'WEEKDAYS', 'DAILY', 'WEEKLY'
    ADD COLUMN IF NOT EXISTS recurring_days VARCHAR(30)[] DEFAULT '{}',         -- e.g. ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI']
    ADD COLUMN IF NOT EXISTS luggage_capacity VARCHAR(30) DEFAULT 'MEDIUM',      -- 'NONE', 'BACKPACK_ONLY', 'MEDIUM', 'LARGE_SUITCASE'
    ADD COLUMN IF NOT EXISTS gender_preference VARCHAR(30) DEFAULT 'ANY',        -- 'ANY', 'FEMALE_ONLY', 'MALE_ONLY'
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS conversation_id UUID,                              -- Linked ephemeral chat
    ADD COLUMN IF NOT EXISTS chat_expires_at TIMESTAMPTZ;

-- 2. Enhance ride_requests table
ALTER TABLE public.ride_requests
    ADD COLUMN IF NOT EXISTS origin_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS origin_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS willing_to_pay_tolls BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(30) DEFAULT 'ONE_TIME';

-- 3. Automated 2-Hour Chat Purge Function
CREATE OR REPLACE FUNCTION public.purge_expired_ride_chats()
RETURNS void AS $$
BEGIN
    -- Delete messages belonging to expired ride conversations
    DELETE FROM public.messages
    WHERE conversation_id IN (
        SELECT conversation_id FROM public.ride_offers
        WHERE chat_expires_at IS NOT NULL AND chat_expires_at <= NOW()
    );

    -- Delete participants belonging to expired ride conversations
    DELETE FROM public.conversation_participants
    WHERE conversation_id IN (
        SELECT conversation_id FROM public.ride_offers
        WHERE chat_expires_at IS NOT NULL AND chat_expires_at <= NOW()
    );

    -- Delete the conversation rows
    DELETE FROM public.conversations
    WHERE id IN (
        SELECT conversation_id FROM public.ride_offers
        WHERE chat_expires_at IS NOT NULL AND chat_expires_at <= NOW()
    );

    -- Unlink expired conversation references
    UPDATE public.ride_offers
    SET conversation_id = NULL
    WHERE chat_expires_at IS NOT NULL AND chat_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Indexing for fast spatial and active ride lookups
CREATE INDEX IF NOT EXISTS idx_ride_offers_status_departure ON public.ride_offers(status, departure_at);
CREATE INDEX IF NOT EXISTS idx_ride_offers_tolls ON public.ride_offers(toll_preference);
CREATE INDEX IF NOT EXISTS idx_ride_offers_chat_expiry ON public.ride_offers(chat_expires_at) WHERE chat_expires_at IS NOT NULL;
