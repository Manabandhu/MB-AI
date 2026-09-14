-- 1. Onboarding Step & Option Catalog (Dynamic configuration)
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
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. User Onboarding Progress & Response Ledger
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
    user_id UUID PRIMARY KEY,
    current_step VARCHAR(50) REFERENCES public.onboarding_steps(step_key),
    is_completed BOOLEAN DEFAULT FALSE,
    selected_reasons TEXT[] DEFAULT '{}',
    metro_location VARCHAR(150),
    zip_code VARCHAR(20),
    university_campus VARCHAR(150),
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

-- 3. Indexes & RLS Policies
CREATE INDEX IF NOT EXISTS idx_onboarding_options_step ON public.onboarding_options(step_key, sort_order);

ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_steps' AND policyname = 'Public read onboarding steps'
    ) THEN
        CREATE POLICY "Public read onboarding steps" ON public.onboarding_steps FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_options' AND policyname = 'Public read onboarding options'
    ) THEN
        CREATE POLICY "Public read onboarding options" ON public.onboarding_options FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_onboarding_progress' AND policyname = 'Users manage own onboarding progress'
    ) THEN
        CREATE POLICY "Users manage own onboarding progress" ON public.user_onboarding_progress
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Seed Steps
INSERT INTO public.onboarding_steps (step_key, step_order, title, subtitle, is_multi_select, is_required) VALUES
('goals', 1, 'What brings you to ManaBandhu?', 'Select what you are looking for so we can tailor your experience.', true, true),
('location', 2, 'Where are you based?', 'Find roommates, rides, and local events closest to you.', false, true),
('languages', 3, 'Which languages do you speak?', 'Connect comfortably in your native tongue.', true, true),
('interests', 4, 'Pick your top community interests', 'Discover relevant groups, job referrals, and meetups.', true, false),
('notifications', 5, 'Stay in the loop', 'Select the alerts that matter to your daily life.', true, false),
('trust_safety', 6, 'Our Community Trust Pledge', 'ManaBandhu is built on verified trust, respect, and zero scams.', false, true)
ON CONFLICT (step_key) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, step_order = EXCLUDED.step_order, is_multi_select = EXCLUDED.is_multi_select, is_required = EXCLUDED.is_required;

-- Seed Options: Goals
INSERT INTO public.onboarding_options (step_key, option_key, label, description, icon_name, sort_order) VALUES
('goals', 'housing', 'Find Housing & Subleases', 'Browse verified rooms, apartments, and shared living', 'home', 1),
('goals', 'rides', 'Carpool & Airport Rides', 'Share commutes to work, universities, and major airports', 'car', 2),
('goals', 'career', 'Job Search & Peer Referrals', 'Get referred directly by verified community members', 'briefcase', 3),
('goals', 'classifieds', 'Classifieds & Marketplace', 'Buy and sell furniture, electronics, and essentials safely', 'shopping-bag', 4),
('goals', 'events', 'Cultural & Student Events', 'Attend regional festivals, networking events, and sports', 'calendar', 5),
('goals', 'immigration', 'Immigration & Visa Guidance', 'Peer discussions on F-1, OPT, STEM, H-1B, and USCIS steps', 'file-text', 6)
ON CONFLICT DO NOTHING;

-- Seed Options: Key Diaspora Metro Locations
INSERT INTO public.onboarding_options (step_key, option_key, label, description, category, sort_order) VALUES
('location', 'dfw', 'Dallas–Fort Worth / Coppell / Irving, TX', 'DFW Metroplex & Tech Corridor', 'metro', 1),
('location', 'bay_area', 'SF Bay Area / San Jose / Sunnyvale, CA', 'Silicon Valley & East Bay', 'metro', 2),
('location', 'chicago', 'Greater Chicago / Naperville, IL', 'Illinois Tech & Financial Hub', 'metro', 3),
('location', 'nj_nyc', 'New Jersey / NYC Metro / Edison', 'Tri-State Area', 'metro', 4),
('location', 'atlanta', 'Greater Atlanta / Alpharetta, GA', 'Southeast Hub', 'metro', 5),
('location', 'seattle', 'Greater Seattle / Bellevue, WA', 'Pacific Northwest Tech Corridor', 'metro', 6)
ON CONFLICT DO NOTHING;

-- Seed Options: Spoken Languages
INSERT INTO public.onboarding_options (step_key, option_key, label, description, sort_order) VALUES
('languages', 'telugu', 'Telugu (తెలుగు)', 'Primary Community Language', 1),
('languages', 'english', 'English', 'Professional & General', 2),
('languages', 'hindi', 'Hindi (हिन्दी)', 'National Language', 3),
('languages', 'tamil', 'Tamil (தமிழ்)', 'Regional Community', 4),
('languages', 'kannada', 'Kannada (ಕನ್ನಡ)', 'Regional Community', 5),
('languages', 'malayalam', 'Malayalam (മലയാളം)', 'Regional Community', 6)
ON CONFLICT DO NOTHING;

-- Seed Options: Community Interests
INSERT INTO public.onboarding_options (step_key, option_key, label, category, sort_order) VALUES
('interests', 'sublease_alerts', 'Sublease & Room Openings', 'housing', 1),
('interests', 'airport_carpool', 'DFW / Airport Shared Rides', 'transit', 2),
('interests', 'tech_interviews', 'Tech Coding & System Design Prep', 'career', 3),
('interests', 'indian_groceries', 'Local Indian Stores & Deals', 'living', 4),
('interests', 'cricket_badminton', 'Weekend Cricket & Badminton', 'sports', 5),
('interests', 'festivals_pooja', 'Diwali, Sankranti & Temple Gatherings', 'culture', 6),
('interests', 'visa_status', 'H-1B & OPT Extension Discussions', 'legal', 7)
ON CONFLICT DO NOTHING;

-- Seed Options: Notification Channels
INSERT INTO public.onboarding_options (step_key, option_key, label, description, category, sort_order) VALUES
('notifications', 'emergency_sos', 'Emergency & Community SOS', 'Immediate regional emergency announcements and campus alerts', 'critical', 1),
('notifications', 'ride_matches', 'Carpool & Ride Match Alerts', 'Instant notifications when a ride matches your route or commute schedule', 'transit', 2),
('notifications', 'room_openings', 'Sublease & Room Openings', 'Real-time pings when verified rooms become available in your target metro', 'housing', 3),
('notifications', 'chat_messages', 'Direct Messages & Inquiries', 'Notifications when flatmates, riders, or referrers message you', 'communication', 4)
ON CONFLICT DO NOTHING;

-- Seed Options: Trust & Safety Commitments
INSERT INTO public.onboarding_options (step_key, option_key, label, description, sort_order) VALUES
('trust_safety', 'verified_identity', 'Real Identities Only', 'I agree to communicate respectfully using my authentic profile information', 1),
('trust_safety', 'no_scams', 'Zero Scam & Broker Fee Policy', 'I will not post fraudulent rental listings, bogus jobs, or unverified fees', 2),
('trust_safety', 'mutual_respect', 'Inclusive & Supportive Environment', 'I pledge to keep ManaBandhu welcoming, safe, and supportive for all students and migrants', 3)
ON CONFLICT DO NOTHING;
