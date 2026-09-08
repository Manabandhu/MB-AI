create extension if not exists postgis;

alter table if exists public.room_listings
    add column if not exists location geography(Point, 4326);

alter table if exists public.ride_offers
    add column if not exists origin_location geography(Point, 4326),
    add column if not exists destination_location geography(Point, 4326);

create index if not exists idx_room_listings_location
    on public.room_listings using gist (location);

create index if not exists idx_ride_offers_origin_location
    on public.ride_offers using gist (origin_location);

create index if not exists idx_ride_offers_destination_location
    on public.ride_offers using gist (destination_location);
