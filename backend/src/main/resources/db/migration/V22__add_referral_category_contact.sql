-- Add category and contact_info columns to referrals table
alter table public.referrals add column if not exists category varchar(100);
alter table public.referrals add column if not exists contact_info varchar(200);
