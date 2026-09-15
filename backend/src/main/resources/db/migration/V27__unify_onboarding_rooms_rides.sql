-- ========================================================
-- 1. DYNAMIC ONBOARDING TABLES
-- ========================================================
CREATE TABLE IF NOT EXISTS public.onboarding_steps (
    step_key VARCHAR(50) PRIMARY KEY,
    step_order INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    subtitle TEXT,
    is_multi_select BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_key VARCHAR(50) REFERENCES public.onboarding_steps(step_key) ON DELETE CASCADE,
    option_key VARCHAR(50) NOT NULL,
    label VARCHAR(150) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    category VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
    user_id UUID PRIMARY KEY,
    current_step VARCHAR(50) REFERENCES public.onboarding_steps(step_key),
    is_completed BOOLEAN DEFAULT FALSE,
    selected_reasons TEXT[] DEFAULT '{}',
    metro_location VARCHAR(150),
    zip_code VARCHAR(20),
    primary_language VARCHAR(50),
    secondary_languages TEXT[] DEFAULT '{}',
    interest_tags TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    bio TEXT,
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    safety_pledge_accepted BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 2. ENHANCE ROOM LISTINGS & AMENITIES
-- ========================================================
CREATE TABLE IF NOT EXISTS public.room_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

ALTER TABLE public.room_listings
    ADD COLUMN IF NOT EXISTS dietary_preference VARCHAR(50) DEFAULT 'ANY',
    ADD COLUMN IF NOT EXISTS gender_preference VARCHAR(50) DEFAULT 'ANY',
    ADD COLUMN IF NOT EXISTS bathroom_type VARCHAR(50) DEFAULT 'SHARED',
    ADD COLUMN IF NOT EXISTS utilities_included BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS est_utility_monthly NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_verified_host BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS university_shuttle_accessible BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS amenity_codes TEXT[] DEFAULT '{}';

-- ========================================================
-- 3. ENHANCE RIDE OFFERS & EPHEMERAL CHAT
-- ========================================================
ALTER TABLE public.ride_offers
    ADD COLUMN IF NOT EXISTS route_polyline TEXT,
    ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS estimated_duration_mins INT,
    ADD COLUMN IF NOT EXISTS toll_preference VARCHAR(30) DEFAULT 'AVOID_TOLLS',
    ADD COLUMN IF NOT EXISTS estimated_toll_amount NUMERIC(6,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(30) DEFAULT 'ONE_TIME',
    ADD COLUMN IF NOT EXISTS recurring_days VARCHAR(30)[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS conversation_id UUID,
    ADD COLUMN IF NOT EXISTS chat_expires_at TIMESTAMPTZ;

-- ========================================================
-- 4. SEED CORE DATA (DIASPORA DEFAULTS)
-- ========================================================
INSERT INTO public.onboarding_steps (step_key, step_order, title, subtitle, is_multi_select, is_required) VALUES
('goals', 1, 'What brings you to ManaBandhu?', 'Select what you are looking for so we can personalize your experience.', true, true),
('location', 2, 'Where are you located?', 'Find flatmates, carpools, and local community closest to you.', false, true),
('languages', 3, 'Languages you speak', 'Connect comfortably with peers in your native tongue.', true, true),
('interests', 4, 'Community interests', 'Discover relevant housing openings, airport rides, and tech meetups.', true, false),
('trust_safety', 5, 'Community Trust Pledge', 'ManaBandhu is built on verified trust, zero scams, and mutual respect.', false, true)
ON CONFLICT (step_key) DO NOTHING;

INSERT INTO public.onboarding_options (step_key, option_key, label, description, icon_name, sort_order) VALUES
('goals', 'housing', 'Find Housing / Subleases', 'Verified rooms and apartments', 'home', 1),
('goals', 'rides', 'Carpool & Airport Rides', 'Share daily commutes and airport trips', 'car', 2),
('goals', 'career', 'Job Referrals & Networking', 'Connect with verified professionals', 'briefcase', 3),
('goals', 'classifieds', 'Classifieds & Buying', 'Buy and sell furniture and essentials safely', 'shopping-bag', 4),
('location', 'dfw', 'Dallas–Fort Worth / Coppell / Irving, TX', 'DFW Metro & Tech Hub', 'map-pin', 1),
('location', 'bay_area', 'SF Bay Area / San Jose / Sunnyvale, CA', 'Silicon Valley', 'map-pin', 2),
('location', 'chicago', 'Greater Chicago / Naperville, IL', 'Midwest Hub', 'map-pin', 3),
('languages', 'telugu', 'Telugu (తెలుగు)', 'Primary Community Language', 'globe', 1),
('languages', 'english', 'English', 'Professional & Daily', 'globe', 2),
('languages', 'hindi', 'Hindi (हिन्दी)', 'National Language', 'globe', 3),
('languages', 'tamil', 'Tamil (தமிழ்)', 'Regional Community', 'globe', 4);

INSERT INTO public.room_amenities (code, label, category, icon_name, sort_order) VALUES
('pure_veg', 'Pure Veg Kitchen Only', 'cultural', 'leaf', 1),
('veg_friendly', 'Vegetarian Friendly', 'cultural', 'check-circle', 2),
('private_bath', 'Private / Attached Bath', 'bath', 'bath', 3),
('furnished_bed', 'Furnished (Bed & Mattress)', 'utility', 'bed', 4),
('study_desk', 'Dedicated Study Desk', 'utility', 'book-open', 5),
('in_unit_laundry', 'In-Unit Washer / Dryer', 'utility', 'refresh-cw', 6),
('campus_shuttle', 'Walk to University Shuttle', 'transit', 'map-pin', 7),
('near_indian_grocery', 'Close to Indian Supermarket', 'cultural', 'shopping-cart', 8)
ON CONFLICT (code) DO NOTHING;

-- ========================================================
-- 5. RLS POLICIES & CHAT PURGE FUNCTION
-- ========================================================
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_amenities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_steps' AND policyname = 'Public read onboarding') THEN
        CREATE POLICY "Public read onboarding" ON public.onboarding_steps FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_options' AND policyname = 'Public read onboarding options') THEN
        CREATE POLICY "Public read onboarding options" ON public.onboarding_options FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_amenities' AND policyname = 'Public read amenities') THEN
        CREATE POLICY "Public read amenities" ON public.room_amenities FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_onboarding_progress' AND policyname = 'Users own onboarding') THEN
        CREATE POLICY "Users own onboarding" ON public.user_onboarding_progress FOR ALL
            USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.purge_expired_ride_chats()
RETURNS void AS $$
BEGIN
    DELETE FROM public.messages
    WHERE conversation_id IN (
        SELECT conversation_id FROM public.ride_offers
        WHERE chat_expires_at IS NOT NULL AND chat_expires_at <= NOW()
    );
    DELETE FROM public.conversations
    WHERE id IN (
        SELECT conversation_id FROM public.ride_offers
        WHERE chat_expires_at IS NOT NULL AND chat_expires_at <= NOW()
    );
    UPDATE public.ride_offers
    SET conversation_id = NULL
    WHERE chat_expires_at IS NOT NULL AND chat_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
