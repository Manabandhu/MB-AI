-- Move PostGIS out of the PostgREST-exposed public schema.
-- V20 installed it into public, so public.spatial_ref_sys (owned by supabase_admin, no RLS, writable by anon and
-- authenticated) was reachable through the Data API. The migration role does not own that table, so it cannot enable
-- RLS or revoke grants; the Supabase-recommended fix is to reinstall the extension in the `extensions` schema.
-- PostGIS is not relocatable, so the extension is dropped and recreated. The only dependents are three location
-- columns (no application code reads them); their values are kept as EWKT and restored. If the extension cannot be
-- dropped (insufficient privilege), the block rolls back to its savepoint and logs a warning instead of failing startup.

create schema if not exists extensions;

do $$
begin
    if not exists (
        select 1 from pg_extension
        where extname = 'postgis' and extnamespace = 'public'::regnamespace
    ) then
        return;
    end if;

    begin
        create temp table postgis_room_locations on commit drop as
            select id, public.st_asewkt(location::public.geometry) as ewkt
            from public.room_listings
            where location is not null;

        create temp table postgis_ride_locations on commit drop as
            select id,
                   public.st_asewkt(origin_location::public.geometry) as origin_ewkt,
                   public.st_asewkt(destination_location::public.geometry) as destination_ewkt
            from public.ride_offers
            where origin_location is not null or destination_location is not null;

        drop extension postgis cascade;
        create extension postgis schema extensions;

        alter table public.room_listings
            add column location extensions.geography(Point, 4326);
        alter table public.ride_offers
            add column origin_location extensions.geography(Point, 4326),
            add column destination_location extensions.geography(Point, 4326);

        update public.room_listings r
        set location = extensions.st_geogfromtext(b.ewkt)
        from postgis_room_locations b
        where r.id = b.id;

        update public.ride_offers r
        set origin_location = case when b.origin_ewkt is null then null else extensions.st_geogfromtext(b.origin_ewkt) end,
            destination_location = case when b.destination_ewkt is null then null
                                        else extensions.st_geogfromtext(b.destination_ewkt) end
        from postgis_ride_locations b
        where r.id = b.id;

        create index if not exists idx_room_listings_location
            on public.room_listings using gist (location);
        create index if not exists idx_ride_offers_origin_location
            on public.ride_offers using gist (origin_location);
        create index if not exists idx_ride_offers_destination_location
            on public.ride_offers using gist (destination_location);
    exception
        when insufficient_privilege or dependent_objects_still_exist then
            raise warning 'PostGIS left in public (%): move it to the extensions schema manually', sqlerrm;
    end;
end $$;
