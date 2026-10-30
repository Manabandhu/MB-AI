-- The backend is the only writer for rides and room inquiries. V16 granted `authenticated` direct read/write on
-- every ride table through the Supabase Data API, with policies that skip the service rules (a user could add
-- themselves as a ride participant, confirm their own booking without using a seat, accept their own seat request,
-- or attach any conversation to their offer). V24/V27 enabled RLS on room_inquiries/room_amenities without revoking,
-- leaving an insert policy that accepted any host/room. Revoke the grants and drop the write policies; the app reads
-- these tables only through the backend.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
        AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.ride_offers, public.ride_requests, public.ride_participants,
            public.ride_bookings, public.ride_ratings, public.room_inquiries, public.room_amenities
            FROM anon, authenticated;
    END IF;
END $$;

DROP POLICY IF EXISTS ride_offers_insert ON public.ride_offers;
DROP POLICY IF EXISTS ride_offers_update ON public.ride_offers;
DROP POLICY IF EXISTS ride_offers_delete ON public.ride_offers;
DROP POLICY IF EXISTS ride_requests_insert ON public.ride_requests;
DROP POLICY IF EXISTS ride_requests_update ON public.ride_requests;
DROP POLICY IF EXISTS ride_requests_delete ON public.ride_requests;
DROP POLICY IF EXISTS ride_participants_insert ON public.ride_participants;
DROP POLICY IF EXISTS ride_participants_delete ON public.ride_participants;
DROP POLICY IF EXISTS ride_bookings_insert ON public.ride_bookings;
DROP POLICY IF EXISTS ride_bookings_update ON public.ride_bookings;
DROP POLICY IF EXISTS ride_bookings_delete ON public.ride_bookings;
DROP POLICY IF EXISTS ride_ratings_insert ON public.ride_ratings;
DROP POLICY IF EXISTS ride_ratings_delete ON public.ride_ratings;
DROP POLICY IF EXISTS "Users insert inquiries" ON public.room_inquiries;

-- Owners can mark a listing rented and relist it later.
ALTER TABLE public.room_listings DROP CONSTRAINT IF EXISTS room_listings_status_valid;
ALTER TABLE public.room_listings
    ADD CONSTRAINT room_listings_status_valid
    CHECK (status IN ('draft', 'active', 'paused', 'archived', 'rejected', 'rented'));

-- Compared a user id with a listing id, so it never prevented anything; the service blocks self-reports.
ALTER TABLE public.room_reports DROP CONSTRAINT IF EXISTS room_reports_not_self;

-- Saved searches store the same room types as listings (up to 50 characters since V26).
ALTER TABLE public.room_saved_searches ALTER COLUMN room_type TYPE varchar(50);
