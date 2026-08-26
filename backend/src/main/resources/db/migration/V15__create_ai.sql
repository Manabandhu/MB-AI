create table if not exists public.assistant_conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title varchar(200),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.assistant_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
    role varchar(20) not null,
    content varchar(4000) not null,
    created_at timestamptz not null default now()
);

create table if not exists public.assistant_citations (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references public.assistant_messages(id) on delete cascade,
    title varchar(300) not null,
    url varchar(500),
    snippet varchar(4000) not null,
    created_at timestamptz not null default now()
);

alter table public.assistant_conversations enable row level security;
revoke all on table public.assistant_conversations from anon, authenticated;
alter table public.assistant_messages enable row level security;
revoke all on table public.assistant_messages from anon, authenticated;
alter table public.assistant_citations enable row level security;
revoke all on table public.assistant_citations from anon, authenticated;
