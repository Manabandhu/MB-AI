-- Marketplace production rules.
-- 1. Listing status, price and currency are constrained (the service already validates; this backs it up).
-- 2. listing_reports lets members flag a listing for moderators.
-- 3. listing_conversations remembers the buyer/seller chat for a listing so "Chat with seller" reuses it.
-- Both new tables are backend-only: RLS on, no grants for anon/authenticated.

UPDATE public.listings SET status = lower(status) WHERE status <> lower(status);
UPDATE public.listings SET status = 'active' WHERE status NOT IN ('active', 'reserved', 'sold', 'removed');
UPDATE public.listings SET currency = upper(currency) WHERE currency <> upper(currency);

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_valid;
ALTER TABLE public.listings
    ADD CONSTRAINT listings_status_valid CHECK (status IN ('active', 'reserved', 'sold', 'removed'));
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_price_not_negative;
ALTER TABLE public.listings ADD CONSTRAINT listings_price_not_negative CHECK (price >= 0);
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_currency_iso;
ALTER TABLE public.listings ADD CONSTRAINT listings_currency_iso CHECK (currency ~ '^[A-Z]{3}$');

CREATE TABLE IF NOT EXISTS public.listing_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason varchar(80) NOT NULL,
    description varchar(4000),
    status varchar(20) NOT NULL DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT listing_reports_reason_not_blank CHECK (length(trim(reason)) > 0),
    CONSTRAINT listing_reports_status_valid CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed'))
);
CREATE INDEX IF NOT EXISTS listing_reports_listing_idx ON public.listing_reports (listing_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS listing_reports_one_open
    ON public.listing_reports (listing_id, reporter_id) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS public.listing_conversations (
    listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (listing_id, buyer_id)
);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
        AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.listing_reports, public.listing_conversations FROM anon, authenticated;
    END IF;
END $$;
