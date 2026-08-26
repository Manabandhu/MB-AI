create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title varchar(200) not null,
    body varchar(4000) not null,
    type varchar(40) not null default 'SYSTEM',
    read boolean not null default false,
    read_at timestamptz,
    action_route varchar(200),
    created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    channel varchar(40) not null,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    constraint notification_preferences_unique unique (user_id, channel)
);

create table if not exists public.device_registrations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    device_token varchar(200) not null,
    platform varchar(20) not null,
    enabled boolean not null default true,
    last_used_at timestamptz,
    created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;
alter table public.notification_preferences enable row level security;
revoke all on table public.notification_preferences from anon, authenticated;
alter table public.device_registrations enable row level security;
revoke all on table public.device_registrations from anon, authenticated;
