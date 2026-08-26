create table if not exists public.communities (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    name varchar(200) not null,
    description varchar(4000),
    created_at timestamptz not null default now()
);

create table if not exists public.post_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.community_posts(id) on delete cascade,
    author_id uuid not null references auth.users(id) on delete cascade,
    body varchar(4000) not null,
    created_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.community_posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    type varchar(20) not null,
    created_at timestamptz not null default now(),
    unique(post_id, user_id)
);

create index if not exists communities_owner_created_at_idx
    on public.communities (owner_id, created_at desc);

create index if not exists post_comments_post_created_at_idx
    on public.post_comments (post_id, created_at desc);

create index if not exists post_reactions_post_created_at_idx
    on public.post_reactions (post_id, created_at desc);

alter table public.communities enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;
revoke all on table public.communities from anon, authenticated;
revoke all on table public.post_comments from anon, authenticated;
revoke all on table public.post_reactions from anon, authenticated;
