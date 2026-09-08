-- Add community_id column to community_posts (referenced by CommunityPost entity)
ALTER TABLE public.community_posts
ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;