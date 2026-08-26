create table if not exists public.job_categories (
    id uuid primary key default gen_random_uuid(),
    name varchar(120) not null,
    slug varchar(120) not null unique,
    created_at timestamptz not null default now(),
    constraint job_categories_name_not_blank check (length(trim(name)) > 0),
    constraint job_categories_slug_not_blank check (length(trim(slug)) > 0)
);

create table if not exists public.job_postings (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid references public.job_categories(id) on delete set null,
    title varchar(200) not null,
    company varchar(200),
    location varchar(200),
    description varchar(4000),
    employment_type varchar(50),
    is_remote boolean,
    salary_min integer,
    salary_max integer,
    application_url varchar(500),
    status varchar(20) not null default 'open',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint job_postings_title_not_blank check (length(trim(title)) > 0)
);

create table if not exists public.job_applications (
    id uuid primary key default gen_random_uuid(),
    job_posting_id uuid not null references public.job_postings(id) on delete cascade,
    applicant_id uuid not null references auth.users(id) on delete cascade,
    cover_letter varchar(4000),
    resume_url varchar(500),
    status varchar(20) not null default 'submitted',
    applied_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists job_postings_status_created_at_idx
    on public.job_postings (status, created_at desc);

create index if not exists job_postings_category_id_idx
    on public.job_postings (category_id);

create index if not exists job_postings_owner_id_idx
    on public.job_postings (owner_id);

create index if not exists job_applications_job_posting_id_idx
    on public.job_applications (job_posting_id, applied_at desc);

create index if not exists job_applications_applicant_id_idx
    on public.job_applications (applicant_id, applied_at desc);

alter table public.job_categories enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;

revoke all on table public.job_categories from anon, authenticated;
revoke all on table public.job_postings from anon, authenticated;
revoke all on table public.job_applications from anon, authenticated;
