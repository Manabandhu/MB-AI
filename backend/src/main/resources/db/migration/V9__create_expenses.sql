create table if not exists public.expense_groups (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    name varchar(120) not null,
    description varchar(4000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint expense_groups_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.expense_groups(id) on delete cascade,
    payer_id uuid not null references auth.users(id) on delete cascade,
    amount numeric(10,2) not null,
    currency varchar(3) not null,
    description varchar(4000),
    category varchar(50),
    expense_date date not null,
    created_at timestamptz not null default now()
);

create table if not exists public.expense_splits (
    id uuid primary key default gen_random_uuid(),
    expense_id uuid not null references public.expenses(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    share_amount numeric(10,2) not null,
    settled boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.settlements (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.expense_groups(id) on delete cascade,
    from_user_id uuid not null references auth.users(id) on delete cascade,
    to_user_id uuid not null references auth.users(id) on delete cascade,
    amount numeric(10,2) not null,
    currency varchar(3) not null,
    status varchar(20) not null default 'pending',
    settled_at timestamptz,
    created_at timestamptz not null default now(),
    constraint settlements_status_valid check (status in ('pending','completed','cancelled'))
);

create index if not exists expense_groups_owner_id_idx
    on public.expense_groups (owner_id, created_at desc);

create index if not exists expenses_group_id_idx
    on public.expenses (group_id, expense_date desc);

create index if not exists expense_splits_expense_id_idx
    on public.expense_splits (expense_id);

create index if not exists settlements_group_id_idx
    on public.settlements (group_id, created_at desc);

alter table public.expense_groups enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

revoke all on table public.expense_groups from anon, authenticated;
revoke all on table public.expenses from anon, authenticated;
revoke all on table public.expense_splits from anon, authenticated;
revoke all on table public.settlements from anon, authenticated;
