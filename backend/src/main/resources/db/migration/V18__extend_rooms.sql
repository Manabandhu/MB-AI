alter table public.room_listings drop constraint if exists room_listings_status_valid;
alter table public.room_listings
    add constraint room_listings_status_valid
    check (status in ('draft','active','paused','archived','rejected'));

create table if not exists public.room_amenities (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    amenity varchar(80) not null,
    created_at timestamptz not null default now(),
    constraint room_amenities_not_blank check (length(trim(amenity)) > 0)
);

create index if not exists room_amenities_listing_id_idx
    on public.room_amenities (listing_id);

create table if not exists public.room_preferences (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    preference varchar(80) not null,
    created_at timestamptz not null default now(),
    constraint room_preferences_not_blank check (length(trim(preference)) > 0)
);

create index if not exists room_preferences_listing_id_idx
    on public.room_preferences (listing_id);

create table if not exists public.room_saved_searches (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(120) not null,
    query varchar(200),
    city varchar(200),
    broad_location varchar(200),
    room_type varchar(20),
    min_price numeric(10,2),
    max_price numeric(10,2),
    available_from date,
    furnished boolean,
    alerts_enabled boolean not null default true,
    last_notified_at timestamptz,
    created_at timestamptz not null default now(),
    constraint room_saved_searches_name_not_blank check (length(trim(name)) > 0)
);

create index if not exists room_saved_searches_user_id_idx
    on public.room_saved_searches (user_id, created_at desc);

create table if not exists public.room_reports (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    reporter_id uuid not null references auth.users(id) on delete cascade,
    reason varchar(80) not null,
    description varchar(4000),
    status varchar(20) not null default 'open',
    reviewer_id uuid references auth.users(id),
    resolution varchar(4000),
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    constraint room_reports_reason_not_blank check (length(trim(reason)) > 0),
    constraint room_reports_status_valid check (status in ('open','in_review','resolved','dismissed')),
    constraint room_reports_not_self check (reporter_id <> listing_id)
);

create index if not exists room_reports_listing_id_idx
    on public.room_reports (listing_id, created_at desc);

create index if not exists room_reports_status_idx
    on public.room_reports (status, created_at desc);

create index if not exists room_reports_reporter_id_idx
    on public.room_reports (reporter_id, created_at desc);

create table if not exists public.room_analytics (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    event_type varchar(20) not null,
    created_at timestamptz not null default now(),
    constraint room_analytics_event_valid check (event_type in ('view','save','inquiry'))
);

create index if not exists room_analytics_listing_id_idx
    on public.room_analytics (listing_id, event_type, created_at desc);

create table if not exists public.room_moderation_actions (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.room_listings(id) on delete cascade,
    actor_id uuid not null references auth.users(id) on delete cascade,
    action varchar(30) not null,
    from_status varchar(20),
    to_status varchar(20),
    reason varchar(4000),
    created_at timestamptz not null default now(),
    constraint room_moderation_action_valid check (action in ('publish','pause','resume','archive','reject','restore','hide'))
);

create index if not exists room_moderation_actions_listing_id_idx
    on public.room_moderation_actions (listing_id, created_at desc);

alter table public.room_amenities enable row level security;
alter table public.room_preferences enable row level security;
alter table public.room_saved_searches enable row level security;
alter table public.room_reports enable row level security;
alter table public.room_analytics enable row level security;
alter table public.room_moderation_actions enable row level security;

revoke all on table public.room_amenities from anon, authenticated;
revoke all on table public.room_preferences from anon, authenticated;
revoke all on table public.room_saved_searches from anon, authenticated;
revoke all on table public.room_reports from anon, authenticated;
revoke all on table public.room_analytics from anon, authenticated;
revoke all on table public.room_moderation_actions from anon, authenticated;

create policy "Room listings public read"
    on public.room_listings for select
    using (status in ('active','paused'));

create policy "Room listings owner write"
    on public.room_listings for all
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

create policy "Room listings admin write"
    on public.room_listings for all
    using (coalesce(nullif(current_setting('request.jwt.claims', true), '')::json -> 'app_metadata' ->> 'roles','') ilike '%super_admin%');

create policy "Room images public read"
    on public.room_images for select
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_images.listing_id and l.status in ('active','paused')
    ));

create policy "Room images owner write"
    on public.room_images for all
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_images.listing_id and l.owner_id = auth.uid()
    ));

create policy "Room availabilities public read"
    on public.room_availabilities for select
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_availabilities.listing_id and l.status in ('active','paused')
    ));

create policy "Room availabilities owner write"
    on public.room_availabilities for all
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_availabilities.listing_id and l.owner_id = auth.uid()
    ));

create policy "Room bookings participant read"
    on public.room_bookings for select
    using (requester_id = auth.uid() or exists (
        select 1 from public.room_listings l
        where l.id = room_bookings.listing_id and l.owner_id = auth.uid()
    ));

create policy "Room bookings requester write"
    on public.room_bookings for all
    using (requester_id = auth.uid())
    with check (requester_id = auth.uid());

create policy "Room bookings owner update"
    on public.room_bookings for update
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_bookings.listing_id and l.owner_id = auth.uid()
    ));

create policy "Room favorites owner write"
    on public.room_favorites for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Room amenities public read"
    on public.room_amenities for select
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_amenities.listing_id and l.status in ('active','paused')
    ));

create policy "Room amenities owner write"
    on public.room_amenities for all
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_amenities.listing_id and l.owner_id = auth.uid()
    ));

create policy "Room preferences public read"
    on public.room_preferences for select
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_preferences.listing_id and l.status in ('active','paused')
    ));

create policy "Room preferences owner write"
    on public.room_preferences for all
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_preferences.listing_id and l.owner_id = auth.uid()
    ));

create policy "Room saved searches owner write"
    on public.room_saved_searches for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Room reports reporter read"
    on public.room_reports for select
    using (reporter_id = auth.uid() or coalesce(nullif(current_setting('request.jwt.claims', true), '')::json -> 'app_metadata' ->> 'roles','') ilike '%super_admin%');

create policy "Room reports reporter insert"
    on public.room_reports for insert
    with check (reporter_id = auth.uid());

create policy "Room analytics public insert"
    on public.room_analytics for insert
    with check (true);

create policy "Room analytics owner read"
    on public.room_analytics for select
    using (exists (
        select 1 from public.room_listings l
        where l.id = room_analytics.listing_id and l.owner_id = auth.uid()
    ));

create policy "Room moderation admin write"
    on public.room_moderation_actions for all
    using (coalesce(nullif(current_setting('request.jwt.claims', true), '')::json -> 'app_metadata' ->> 'roles','') ilike '%super_admin%');
