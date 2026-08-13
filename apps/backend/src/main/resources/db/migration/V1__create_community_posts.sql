create table if not exists public.community_posts (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    title varchar(120) not null,
    body varchar(4000) not null,
    created_at timestamptz not null default now(),
    constraint community_posts_title_not_blank check (length(trim(title)) > 0),
    constraint community_posts_body_not_blank check (length(trim(body)) > 0)
);

create index if not exists community_posts_created_at_idx
    on public.community_posts (created_at desc);

create index if not exists community_posts_owner_created_idx
    on public.community_posts (owner_id, created_at desc);

alter table public.community_posts enable row level security;
revoke all on table public.community_posts from anon, authenticated;
