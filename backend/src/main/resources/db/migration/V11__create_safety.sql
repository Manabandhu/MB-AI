create table if not exists public.safety_reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references auth.users(id) on delete cascade,
    target_id uuid not null references auth.users(id) on delete cascade,
    category varchar(80) not null,
    description varchar(4000) not null,
    status varchar(40) not null default 'OPEN',
    severity varchar(40) not null default 'MEDIUM',
    evidence_urls varchar(2000),
    created_at timestamptz not null default now(),
    resolved_at timestamptz
);

create table if not exists public.blocked_users (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    blocked_user_id uuid not null references auth.users(id) on delete cascade,
    reason varchar(500),
    created_at timestamptz not null default now(),
    constraint blocked_users_unique unique (owner_id, blocked_user_id)
);

create table if not exists public.trusted_contacts (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    name varchar(120) not null,
    phone varchar(20),
    email varchar(200),
    relationship varchar(120),
    created_at timestamptz not null default now()
);

alter table public.safety_reports enable row level security;
revoke all on table public.safety_reports from anon, authenticated;
alter table public.blocked_users enable row level security;
revoke all on table public.blocked_users from anon, authenticated;
alter table public.trusted_contacts enable row level security;
revoke all on table public.trusted_contacts from anon, authenticated;
