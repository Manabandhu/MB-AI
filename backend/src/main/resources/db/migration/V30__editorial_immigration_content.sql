-- Editorial immigration guides and resources are published by the platform, not by a member,
-- so they may have no owner. Member-authored rows keep their owner_id.
ALTER TABLE public.immigration_guides ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.immigration_resources ALTER COLUMN owner_id DROP NOT NULL;
