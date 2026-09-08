alter table if exists public.notifications
    add column if not exists dispatched boolean not null default false,
    add column if not exists dispatched_at timestamp;
