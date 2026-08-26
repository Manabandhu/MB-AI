create table if not exists public.listing_categories (
    id uuid primary key default gen_random_uuid(),
    name varchar(120) not null,
    slug varchar(120) not null unique,
    created_at timestamptz not null default now(),
    constraint listing_categories_name_not_blank check (length(trim(name)) > 0),
    constraint listing_categories_slug_not_blank check (length(trim(slug)) > 0)
);

create table if not exists public.listings (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid references public.listing_categories(id) on delete set null,
    title varchar(200) not null,
    description varchar(4000),
    price numeric(10,2) not null,
    currency varchar(3) not null,
    condition varchar(20),
    location varchar(200),
    is_negotiable boolean,
    status varchar(20) not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint listings_title_not_blank check (length(trim(title)) > 0)
);

create table if not exists public.listing_images (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.listings(id) on delete cascade,
    url varchar(500) not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.listing_favorites (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.listings(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint listing_favorites_unique unique (listing_id, user_id)
);

create index if not exists listings_status_created_at_idx
    on public.listings (status, created_at desc);

create index if not exists listings_category_id_idx
    on public.listings (category_id);

create index if not exists listings_owner_id_idx
    on public.listings (owner_id);

create index if not exists listing_images_listing_id_idx
    on public.listing_images (listing_id, sort_order);

create index if not exists listing_favorites_user_id_idx
    on public.listing_favorites (user_id, created_at desc);

alter table public.listing_categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_favorites enable row level security;

revoke all on table public.listing_categories from anon, authenticated;
revoke all on table public.listings from anon, authenticated;
revoke all on table public.listing_images from anon, authenticated;
revoke all on table public.listing_favorites from anon, authenticated;
