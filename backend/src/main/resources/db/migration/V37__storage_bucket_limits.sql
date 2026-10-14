-- Storage buckets used by /api/v1/media/upload-url, with the same type and size limits the backend checks, so a
-- signed upload URL cannot be used to store something else. Supabase-only: skipped where the storage schema does
-- not exist (local PostgreSQL). Image buckets are public-read (listing photos, avatars); documents stay private.
DO $$
BEGIN
    IF to_regclass('storage.buckets') IS NULL THEN
        RETURN;
    END IF;
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
        ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif']),
        ('rooms', 'rooms', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif']),
        ('rides', 'rides', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif']),
        ('posts', 'posts', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif']),
        ('community', 'community', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif']),
        ('marketplace', 'marketplace', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif']),
        ('documents', 'documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif','application/pdf'])
    ON CONFLICT (id) DO UPDATE
        SET public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
END $$;
