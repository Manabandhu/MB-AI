-- ========================================================
-- 1. High-Performance Composite & Spatial Indexes for High Concurrency
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_room_listings_search_composite 
    ON public.room_listings(status, broad_location, price, dietary_preference);

CREATE INDEX IF NOT EXISTS idx_room_listings_geo_point 
    ON public.room_listings USING GIST (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    );

CREATE INDEX IF NOT EXISTS idx_room_listings_location 
    ON public.room_listings USING GIST (location);

-- ========================================================
-- 2. Seed 100 Synthetic Users in auth.users and user_onboarding_progress
-- ========================================================
DO $$
DECLARE
    new_user_id UUID;
    i INT;
    names TEXT[] := ARRAY['Rahul Sharma', 'Sneha Patel', 'Vikram Reddy', 'Ananya Rao', 'Karthik Varma', 'Pooja Iyer', 'Siddharth Nair', 'Divya Teja', 'Suresh Kumar', 'Deepika Chowdary'];
    metros TEXT[] := ARRAY['Dallas–Fort Worth, TX', 'San Francisco Bay Area, CA', 'Greater Chicago, IL', 'New Jersey / NYC Metro'];
    user_email TEXT;
BEGIN
    FOR i IN 1..100 LOOP
        user_email := 'synthetic_seed_user_' || i || '@manabandhu.test';

        SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;

        IF new_user_id IS NULL THEN
            new_user_id := gen_random_uuid();
            INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password,
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                is_sso_user, created_at, updated_at
            ) VALUES (
                new_user_id,
                '00000000-0000-0000-0000-000000000000'::uuid,
                'authenticated',
                'authenticated',
                user_email,
                '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',
                NOW(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                jsonb_build_object('full_name', names[(i % 10) + 1]),
                false,
                NOW(),
                NOW()
            );
        END IF;

        INSERT INTO public.user_onboarding_progress (
            user_id, current_step, is_completed, selected_reasons, 
            metro_location, primary_language, secondary_languages, 
            interest_tags, bio, safety_pledge_accepted, completed_at
        ) VALUES (
            new_user_id, 'trust_safety', true, ARRAY['housing', 'rides', 'career'],
            metros[(i % 4) + 1], 'telugu', ARRAY['english', 'hindi'],
            ARRAY['sublease_alerts', 'airport_carpool', 'tech_interviews'],
            names[(i % 10) + 1] || ' - Software Engineer & Community Member',
            true, NOW()
        ) ON CONFLICT (user_id) DO UPDATE SET
            is_completed = true,
            current_step = 'trust_safety',
            completed_at = NOW();
    END LOOP;
END $$;

-- ========================================================
-- 3. Seed 60 Realistic Listings (DFW, Bay Area, Chicago, NJ)
-- ========================================================
DO $$
DECLARE
    seed_owner_id UUID;
    i INT;
    v_lat NUMERIC(10,6);
    v_lng NUMERIC(11,6);
    v_title TEXT;
    v_price NUMERIC(10,2);
    v_deposit NUMERIC(10,2);
    v_utility NUMERIC(10,2);
    v_util_inc BOOLEAN;
    v_room_type VARCHAR(50);
    v_bath VARCHAR(50);
    v_diet VARCHAR(50);
    v_gender VARCHAR(50);
    v_loc VARCHAR(200);
    v_addr VARCHAR(4000);
    v_state VARCHAR(50);
    v_county VARCHAR(100);
BEGIN
    SELECT user_id INTO seed_owner_id 
    FROM public.user_onboarding_progress 
    WHERE bio LIKE '%Community Member%' 
    LIMIT 1;

    IF seed_owner_id IS NULL THEN
        SELECT id INTO seed_owner_id FROM auth.users LIMIT 1;
    END IF;

    -- Avoid duplicate inserts if migration is re-run
    IF NOT EXISTS (SELECT 1 FROM public.room_listings WHERE broad_location = 'Coppell, TX' AND title LIKE '%Cypress Waters%') THEN
        FOR i IN 1..60 LOOP
            v_title := CASE (i % 6)
                WHEN 0 THEN 'Private Master Bed & Bath near Cypress Waters Tech Park'
                WHEN 1 THEN 'Furnished Shared Room on UTD Comet Cruiser Route'
                WHEN 2 THEN '1B1B in Luxury Valley Ranch Community with Lake View'
                WHEN 3 THEN 'Private Room in Independent House near India Bazaar'
                WHEN 4 THEN 'Studio Apartment Sublease near Silicon Valley Caltrain'
                ELSE 'Spacious 2B2B Shared Room near Patel Brothers & Metra'
            END;

            v_price := CASE (i % 6)
                WHEN 0 THEN 780.00
                WHEN 1 THEN 420.00
                WHEN 2 THEN 920.00
                WHEN 3 THEN 650.00
                WHEN 4 THEN 1350.00
                ELSE 550.00
            END;

            v_deposit := CASE (i % 6) WHEN 1 THEN 250.00 ELSE 500.00 END;
            v_utility := CASE (i % 6) WHEN 2 THEN 0.00 ELSE 55.00 END;
            v_util_inc := CASE (i % 6) WHEN 2 THEN true ELSE false END;
            v_room_type := CASE (i % 2) WHEN 0 THEN 'Private Room' ELSE 'Shared 2B2B' END;
            v_bath := CASE (i % 3) WHEN 0 THEN 'PRIVATE_ATTACHED' WHEN 1 THEN 'PRIVATE_DEDICATED' ELSE 'SHARED' END;
            v_diet := CASE (i % 3) WHEN 0 THEN 'PURE_VEG' WHEN 1 THEN 'VEG_FRIENDLY' ELSE 'ANY' END;
            v_gender := CASE (i % 3) WHEN 0 THEN 'MALE_ONLY' WHEN 1 THEN 'FEMALE_ONLY' ELSE 'ANY' END;

            IF (i % 4) = 0 THEN
                v_lat := 32.9546 + ((i % 10) * 0.003);
                v_lng := -96.9903 + ((i % 10) * 0.003);
                v_loc := 'Coppell, TX';
                v_addr := 'S Denton Tap Rd, Coppell, TX 75019';
                v_state := 'TX';
                v_county := 'Dallas';
            ELSIF (i % 4) = 1 THEN
                v_lat := 32.9857 + ((i % 10) * 0.003);
                v_lng := -96.7501 + ((i % 10) * 0.003);
                v_loc := 'Richardson, TX';
                v_addr := 'Synergy Park Blvd, Richardson, TX 75080';
                v_state := 'TX';
                v_county := 'Dallas';
            ELSIF (i % 4) = 2 THEN
                v_lat := 37.3688 + ((i % 10) * 0.003);
                v_lng := -122.0363 + ((i % 10) * 0.003);
                v_loc := 'Sunnyvale, CA';
                v_addr := 'El Camino Real, Sunnyvale, CA 94086';
                v_state := 'CA';
                v_county := 'Santa Clara';
            ELSE
                v_lat := 41.7725 + ((i % 10) * 0.003);
                v_lng := -88.1535 + ((i % 10) * 0.003);
                v_loc := 'Naperville, IL';
                v_addr := 'Route 59 & 75th St, Naperville, IL 60540';
                v_state := 'IL';
                v_county := 'DuPage';
            END IF;

            INSERT INTO public.room_listings (
                owner_id, title, description, price, security_deposit, est_utility_monthly, 
                utilities_included, room_type, bathroom_type, dietary_preference, gender_preference, 
                latitude, longitude, location, broad_location, exact_address, state_code, county,
                is_verified_host, university_shuttle_accessible, amenity_codes, status
            ) VALUES (
                seed_owner_id,
                v_title,
                'Clean, quiet household. Pure veg or veg-friendly kitchen preferred. High-speed Wi-Fi, in-unit laundry, and parking included. Safe community.',
                v_price,
                v_deposit,
                v_utility,
                v_util_inc,
                v_room_type,
                v_bath,
                v_diet,
                v_gender,
                v_lat,
                v_lng,
                ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography,
                v_loc,
                v_addr,
                v_state,
                v_county,
                true,
                CASE WHEN (i % 4) = 1 THEN true ELSE false END,
                ARRAY['pure_veg', 'private_bath', 'furnished_bed', 'study_desk', 'wifi_high_speed', 'in_unit_laundry', 'campus_shuttle'],
                'active'
            );
        END LOOP;
    END IF;
END $$;
