-- Widen room_type and state_code to accommodate multi-word options and full state names
ALTER TABLE public.room_listings ALTER COLUMN room_type TYPE VARCHAR(50);
ALTER TABLE public.room_listings ALTER COLUMN state_code TYPE VARCHAR(50);

-- Add 'rejected' to the status check constraint (service uses it for moderation)
ALTER TABLE public.room_listings
    DROP CONSTRAINT IF EXISTS room_listings_status_valid;

ALTER TABLE public.room_listings
    ADD CONSTRAINT room_listings_status_valid
    CHECK (status IN ('draft', 'active', 'paused', 'archived', 'rejected'));
