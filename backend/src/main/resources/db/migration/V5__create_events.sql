create table if not exists public.event_categories (
    id uuid primary key default gen_random_uuid(),
    name varchar(120) not null,
    description varchar(4000),
    created_at timestamptz not null default now()
);

create table if not exists public.events (
    id uuid primary key default gen_random_uuid(),
    organizer_id uuid not null references auth.users(id) on delete cascade,
    title varchar(200) not null,
    description varchar(4000),
    location varchar(200) not null,
    latitude numeric(10,6),
    longitude numeric(11,6),
    start_at timestamptz not null,
    end_at timestamptz not null,
    category_id uuid not null references public.event_categories(id),
    status varchar(20) not null default 'published',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.event_attendance (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status varchar(20) not null,
    created_at timestamptz not null default now(),
    unique(event_id, user_id)
);

create index if not exists events_status_start_at_idx
    on public.events (status, start_at asc);

create index if not exists events_organizer_created_at_idx
    on public.events (organizer_id, created_at desc);

create index if not exists event_attendance_event_created_at_idx
    on public.event_attendance (event_id, created_at desc);

alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.event_attendance enable row level security;
revoke all on table public.event_categories from anon, authenticated;
revoke all on table public.events from anon, authenticated;
revoke all on table public.event_attendance from anon, authenticated;
