create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    type varchar(20) not null default 'DIRECT',
    title varchar(200),
    created_at timestamptz not null default now(),
    last_message_at timestamptz
);

create table if not exists public.conversation_participants (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    joined_at timestamptz not null default now(),
    left_at timestamptz,
    role varchar(20) not null default 'MEMBER',
    constraint conversation_participants_unique unique (conversation_id, user_id)
);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    body varchar(4000) not null,
    message_type varchar(20) not null default 'TEXT',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
revoke all on table public.conversations from anon, authenticated;
alter table public.conversation_participants enable row level security;
revoke all on table public.conversation_participants from anon, authenticated;
alter table public.messages enable row level security;
revoke all on table public.messages from anon, authenticated;
