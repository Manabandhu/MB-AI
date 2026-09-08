alter table if exists public.ride_offers
    add column if not exists reported boolean not null default false;
