create table if not exists public.immigration_resources (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    title varchar(200) not null,
    description varchar(4000) not null,
    category varchar(80) not null,
    url varchar(500),
    resource_type varchar(40) not null,
    tags varchar(400),
    is_verified boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.immigration_guides (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    title varchar(200) not null,
    description varchar(4000) not null,
    content varchar(4000) not null,
    category varchar(80) not null,
    difficulty_level varchar(40) not null,
    estimated_duration_minutes integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.immigration_checklists (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    title varchar(200) not null,
    description varchar(4000) not null,
    category varchar(80) not null,
    items_json varchar(4000) not null,
    due_date timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.immigration_news (
    id uuid primary key default gen_random_uuid(),
    title varchar(300) not null,
    body varchar(4000) not null,
    source varchar(200),
    url varchar(500),
    category varchar(80) not null,
    published_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.faq_items (
    id uuid primary key default gen_random_uuid(),
    question varchar(500) not null,
    answer varchar(4000) not null,
    category varchar(80) not null,
    tags varchar(400),
    is_published boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

alter table public.immigration_resources enable row level security;
revoke all on table public.immigration_resources from anon, authenticated;
alter table public.immigration_guides enable row level security;
revoke all on table public.immigration_guides from anon, authenticated;
alter table public.immigration_checklists enable row level security;
revoke all on table public.immigration_checklists from anon, authenticated;
alter table public.immigration_news enable row level security;
revoke all on table public.immigration_news from anon, authenticated;
alter table public.faq_items enable row level security;
revoke all on table public.faq_items from anon, authenticated;
