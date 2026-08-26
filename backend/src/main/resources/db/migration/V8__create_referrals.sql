create table if not exists public.referrals (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    recipient_id uuid not null references auth.users(id) on delete cascade,
    type varchar(10) not null,
    status varchar(20) not null default 'pending',
    title varchar(200) not null,
    description varchar(4000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint referrals_title_not_blank check (length(trim(title)) > 0),
    constraint referrals_type_valid check (type in ('request','offer'))
);

create table if not exists public.referral_requests (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid not null unique references public.referrals(id) on delete cascade,
    category varchar(100) not null,
    details varchar(4000),
    urgency varchar(20) not null,
    desired_outcome varchar(4000),
    created_at timestamptz not null default now(),
    constraint referral_requests_urgency_valid check (urgency in ('low','medium','high'))
);

create table if not exists public.referral_offers (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid not null unique references public.referrals(id) on delete cascade,
    service_type varchar(100) not null,
    availability varchar(4000),
    terms varchar(4000),
    expires_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists referrals_owner_id_idx
    on public.referrals (owner_id, created_at desc);

create index if not exists referrals_recipient_id_idx
    on public.referrals (recipient_id);

create index if not exists referral_requests_category_idx
    on public.referral_requests (category, created_at desc);

create index if not exists referral_offers_service_type_idx
    on public.referral_offers (service_type, created_at desc);

alter table public.referrals enable row level security;
alter table public.referral_requests enable row level security;
alter table public.referral_offers enable row level security;

revoke all on table public.referrals from anon, authenticated;
revoke all on table public.referral_requests from anon, authenticated;
revoke all on table public.referral_offers from anon, authenticated;
