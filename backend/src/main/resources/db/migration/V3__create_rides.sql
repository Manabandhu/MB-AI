create table if not exists public.ride_offers (
    id uuid primary key default gen_random_uuid(),
    driver_id uuid not null references auth.users(id) on delete cascade,
    origin_area varchar(200) not null,
    destination_area varchar(200) not null,
    departure_at timestamptz not null,
    seats_total integer not null,
    seats_available integer not null,
    contribution varchar(200) not null,
    status varchar(20) not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ride_offers_seats_total_positive check (seats_total > 0),
    constraint ride_offers_seats_available_positive check (seats_available >= 0),
    constraint ride_offers_seats_available_le_total check (seats_available <= seats_total),
    constraint ride_offers_status_valid check (status in ('draft','active','completed','cancelled'))
);

create table if not exists public.ride_requests (
    id uuid primary key default gen_random_uuid(),
    ride_id uuid not null references public.ride_offers(id) on delete cascade,
    rider_id uuid not null references auth.users(id) on delete cascade,
    seats_requested integer not null,
    message varchar(4000),
    status varchar(20) not null default 'pending',
    created_at timestamptz not null default now(),
    constraint ride_requests_seats_positive check (seats_requested > 0),
    constraint ride_requests_status_valid check (status in ('pending','accepted','rejected','withdrawn'))
);

create table if not exists public.ride_participants (
    id uuid primary key default gen_random_uuid(),
    ride_id uuid not null references public.ride_offers(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role varchar(20) not null,
    joined_at timestamptz not null default now(),
    constraint ride_participants_role_valid check (role in ('driver','rider')),
    constraint ride_participants_unique_ride_user unique (ride_id, user_id)
);

create table if not exists public.ride_bookings (
    id uuid primary key default gen_random_uuid(),
    ride_id uuid not null references public.ride_offers(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    seats_booked integer not null,
    status varchar(20) not null default 'pending',
    created_at timestamptz not null default now(),
    constraint ride_bookings_seats_positive check (seats_booked > 0),
    constraint ride_bookings_status_valid check (status in ('pending','confirmed','cancelled'))
);

create table if not exists public.ride_ratings (
    id uuid primary key default gen_random_uuid(),
    ride_id uuid not null references public.ride_offers(id) on delete cascade,
    rater_id uuid not null references auth.users(id) on delete cascade,
    ratee_id uuid not null references auth.users(id) on delete cascade,
    rating integer not null,
    comment varchar(4000),
    created_at timestamptz not null default now(),
    constraint ride_ratings_values_valid check (rating >= 1 and rating <= 5),
    constraint ride_ratings_not_self check (rater_id <> ratee_id)
);

create index if not exists ride_offers_status_departure_idx
    on public.ride_offers (status, departure_at asc);

create index if not exists ride_offers_driver_id_idx
    on public.ride_offers (driver_id, created_at desc);

create index if not exists ride_offers_origin_area_idx
    on public.ride_offers (origin_area, status, departure_at asc);

create index if not exists ride_offers_destination_area_idx
    on public.ride_offers (destination_area, status, departure_at asc);

create index if not exists ride_requests_ride_id_idx
    on public.ride_requests (ride_id, created_at desc);

create index if not exists ride_requests_rider_id_idx
    on public.ride_requests (rider_id, created_at desc);

create index if not exists ride_participants_ride_id_idx
    on public.ride_participants (ride_id, joined_at asc);

create index if not exists ride_participants_user_id_idx
    on public.ride_participants (user_id, joined_at desc);

create index if not exists ride_bookings_ride_id_idx
    on public.ride_bookings (ride_id, created_at desc);

create index if not exists ride_bookings_user_id_idx
    on public.ride_bookings (user_id, created_at desc);

create index if not exists ride_ratings_ride_id_idx
    on public.ride_ratings (ride_id, created_at desc);

create index if not exists ride_ratings_ratee_id_idx
    on public.ride_ratings (ratee_id, created_at desc);

alter table public.ride_offers enable row level security;
alter table public.ride_requests enable row level security;
alter table public.ride_participants enable row level security;
alter table public.ride_bookings enable row level security;
alter table public.ride_ratings enable row level security;

revoke all on table public.ride_offers from anon, authenticated;
revoke all on table public.ride_requests from anon, authenticated;
revoke all on table public.ride_participants from anon, authenticated;
revoke all on table public.ride_bookings from anon, authenticated;
revoke all on table public.ride_ratings from anon, authenticated;
