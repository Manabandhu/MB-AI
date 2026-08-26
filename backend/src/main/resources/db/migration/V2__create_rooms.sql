create table if not exists public.room_listings (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    title varchar(200) not null,
    description varchar(4000),
    price numeric(10,2) not null,
    room_type varchar(20) not null,
    status varchar(20) not null default 'active',
    broad_location varchar(200),
    exact_address varchar(4000),
    latitude numeric(10,6),
    longitude numeric(11,6),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint room_listings_title_not_blank check (length(trim(title)) > 0),
    constraint room_listings_status_valid check (status in ('draft','active','paused','archived'))
);

create table if not exists public.room_images (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    url varchar(500) not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    constraint room_images_url_not_blank check (length(trim(url)) > 0)
);

create table if not exists public.room_availabilities (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    available_from date not null,
    available_to date not null,
    min_stay_months integer not null default 1,
    created_at timestamptz not null default now(),
    constraint room_availabilities_date_range_valid check (available_to >= available_from),
    constraint room_availabilities_min_stay_valid check (min_stay_months >= 0)
);

create table if not exists public.room_bookings (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    requester_id uuid not null references auth.users(id) on delete cascade,
    status varchar(20) not null default 'pending',
    message varchar(4000),
    created_at timestamptz not null default now(),
    constraint room_bookings_status_valid check (status in ('pending','accepted','rejected','cancelled'))
);

create table if not exists public.room_favorites (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint room_favorites_unique unique (listing_id, user_id)
);

create index if not exists room_listings_status_created_at_idx
    on public.room_listings (status, created_at desc);

create index if not exists room_listings_owner_id_idx
    on public.room_listings (owner_id, created_at desc);

create index if not exists room_listings_broad_location_idx
    on public.room_listings (broad_location, status, created_at desc);

create index if not exists room_listings_room_type_status_idx
    on public.room_listings (room_type, status, created_at desc);

create index if not exists room_images_listing_id_idx
    on public.room_images (listing_id, sort_order);

create index if not exists room_availabilities_listing_id_idx
    on public.room_availabilities (listing_id, available_from asc);

create index if not exists room_bookings_listing_id_idx
    on public.room_bookings (listing_id, created_at desc);

create index if not exists room_bookings_requester_id_idx
    on public.room_bookings (requester_id, created_at desc);

create index if not exists room_favorites_user_id_idx
    on public.room_favorites (user_id, created_at desc);

alter table public.room_listings enable row level security;
alter table public.room_images enable row level security;
alter table public.room_availabilities enable row level security;
alter table public.room_bookings enable row level security;
alter table public.room_favorites enable row level security;

revoke all on table public.room_listings from anon, authenticated;
revoke all on table public.room_images from anon, authenticated;
revoke all on table public.room_availabilities from anon, authenticated;
revoke all on table public.room_bookings from anon, authenticated;
revoke all on table public.room_favorites from anon, authenticated;
