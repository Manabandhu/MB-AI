-- ========================================================
-- 1. CHAT ENHANCEMENTS (REALTIME & ATTACHMENTS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) DEFAULT 'DIRECT',
    title VARCHAR(150),
    metadata JSONB DEFAULT '{}'::jsonb,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    role VARCHAR(30) DEFAULT 'MEMBER',
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'TEXT',
    metadata JSONB DEFAULT '{}'::jsonb,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 2. COMMUNITY CITY & CAMPUS HUBS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communities ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE public.communities
    ADD COLUMN IF NOT EXISTS slug VARCHAR(150),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'CITY',
    ADD COLUMN IF NOT EXISTS metro_area VARCHAR(100),
    ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_url TEXT,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);

CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- Seed Default Diaspora Hubs
INSERT INTO public.communities (name, slug, description, category, metro_area, member_count) VALUES
('Dallas–Fort Worth Telugu Community', 'dfw-telugu', 'Hub for housing, rides, and cultural events in DFW (Coppell, Irving, Frisco, Plano).', 'CITY', 'Dallas–Fort Worth, TX', 1240),
('UT Dallas Indian Students Association', 'utd-isa', 'Student subleases, airport rides, campus tips, and peer advice for UT Dallas.', 'CAMPUS', 'Richardson, TX', 850),
('Bay Area Telugu Techies', 'bay-area-tech', 'H-1B, job referrals, carpooling, and weekend meetups across Silicon Valley.', 'PROFESSIONAL', 'San Jose, CA', 940),
('Greater Chicago Community', 'chicago-community', 'Indian diaspora network in Naperville, Schaumburg, and downtown Chicago.', 'CITY', 'Chicago, IL', 520)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    metro_area = EXCLUDED.metro_area,
    member_count = EXCLUDED.member_count;

-- ========================================================
-- 3. SHARED EXPENSES & NET SETTLEMENTS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.expense_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expense_groups ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE public.expense_groups
    ADD COLUMN IF NOT EXISTS group_type VARCHAR(30) DEFAULT 'APARTMENT',
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS created_by UUID;

CREATE TABLE IF NOT EXISTS public.expense_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS payer_id UUID,
    ADD COLUMN IF NOT EXISTS title VARCHAR(150),
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS split_type VARCHAR(30) DEFAULT 'EQUAL';

CREATE TABLE IF NOT EXISTS public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expense_splits
    ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL,
    to_user_id UUID NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'SETTLED',
    settled_at TIMESTAMPTZ DEFAULT NOW()
);
