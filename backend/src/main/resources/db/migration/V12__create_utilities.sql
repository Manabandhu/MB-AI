create table if not exists public.package_tracking (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    tracking_number varchar(80) not null,
    carrier varchar(80) not null,
    status varchar(40) not null default 'PENDING',
    estimated_delivery timestamptz,
    last_update timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create table if not exists public.nearby_places (
    id uuid primary key default gen_random_uuid(),
    name varchar(200) not null,
    category varchar(80) not null,
    address varchar(400) not null,
    latitude double precision not null,
    longitude double precision not null,
    rating double precision,
    distance_km double precision,
    phone varchar(20),
    created_at timestamptz not null default now()
);

create table if not exists public.emergency_resources (
    id uuid primary key default gen_random_uuid(),
    name varchar(200) not null,
    category varchar(80) not null,
    address varchar(400) not null,
    phone varchar(20),
    hours varchar(120),
    description varchar(4000) not null,
    latitude double precision not null,
    longitude double precision not null,
    created_at timestamptz not null default now()
);

alter table public.package_tracking enable row level security;
revoke all on table public.package_tracking from anon, authenticated;
alter table public.nearby_places enable row level security;
revoke all on table public.nearby_places from anon, authenticated;
alter table public.emergency_resources enable row level security;
revoke all on table public.emergency_resources from anon, authenticated;
