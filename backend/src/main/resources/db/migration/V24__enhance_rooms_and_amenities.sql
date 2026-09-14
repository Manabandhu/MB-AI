DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'room_amenities' AND column_name = 'listing_id'
    ) THEN
        ALTER TABLE public.room_amenities RENAME TO room_listing_amenities;
    END IF;
END $$;

-- 1. Dynamic Amenities Catalog (No hardcoded arrays in frontend)
CREATE TABLE IF NOT EXISTS public.room_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

-- 2. Enhance room_listings with diaspora & verification attributes
ALTER TABLE public.room_listings 
    ADD COLUMN IF NOT EXISTS dietary_preference VARCHAR(50) DEFAULT 'ANY',
    ADD COLUMN IF NOT EXISTS gender_preference VARCHAR(50) DEFAULT 'ANY',
    ADD COLUMN IF NOT EXISTS bathroom_type VARCHAR(50) DEFAULT 'SHARED',
    ADD COLUMN IF NOT EXISTS utilities_included BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS est_utility_monthly NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS lease_term VARCHAR(50) DEFAULT 'FLEXIBLE',
    ADD COLUMN IF NOT EXISTS is_verified_host BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS university_shuttle_accessible BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS amenity_codes TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS state_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS county VARCHAR(100);

-- 3. Room Inquiries Ledger
CREATE TABLE IF NOT EXISTS public.room_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.room_listings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    move_in_date DATE NOT NULL,
    stay_duration_months INT DEFAULT 6,
    dietary_lifestyle VARCHAR(50),
    intro_message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.room_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_inquiries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_amenities' AND policyname = 'Public read amenities') THEN
        CREATE POLICY "Public read amenities" ON public.room_amenities FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_inquiries' AND policyname = 'Users read own inquiries') THEN
        CREATE POLICY "Users read own inquiries" ON public.room_inquiries FOR SELECT 
            USING (auth.uid() = sender_id OR auth.uid() = host_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_inquiries' AND policyname = 'Users insert inquiries') THEN
        CREATE POLICY "Users insert inquiries" ON public.room_inquiries FOR INSERT 
            WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- 5. Seed Real-World Diaspora Housing Amenities
INSERT INTO public.room_amenities (code, label, category, icon_name, sort_order) VALUES
('pure_veg', 'Pure Veg Kitchen Only', 'cultural', 'leaf', 1),
('veg_friendly', 'Vegetarian Friendly Household', 'cultural', 'check-circle', 2),
('private_bath', 'Private / Attached Bathroom', 'bath', 'bath', 3),
('furnished_bed', 'Furnished (Bed & Mattress Included)', 'utility', 'bed', 4),
('study_desk', 'Dedicated Study / Work Desk', 'utility', 'book-open', 5),
('in_unit_laundry', 'In-Unit Washer & Dryer', 'utility', 'refresh-cw', 6),
('wifi_high_speed', 'Gigabit WiFi Included', 'utility', 'wifi', 7),
('free_parking', 'Covered / Garage Parking Spot', 'utility', 'truck', 8),
('patel_bros_nearby', 'Close to Indian Grocery / Stores', 'cultural', 'shopping-cart', 9),
('campus_shuttle', 'Walkable to University Shuttle Route', 'utility', 'map-pin', 10),
('no_smoking', 'Strictly No Smoking / No Vaping', 'policy', 'slash', 11),
('quiet_hours', 'Enforced Quiet Hours (Study Friendly)', 'policy', 'moon', 12)
ON CONFLICT (code) DO NOTHING;
