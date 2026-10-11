-- Account deletion removes the Supabase auth user and relies on ON DELETE rules. room_reports.reviewer_id was the
-- only auth.users reference without one, so deleting a moderator who reviewed a report failed. Keep the report and
-- clear the reviewer instead.
DO $$
DECLARE
    constraint_name text;
BEGIN
    IF to_regclass('public.room_reports') IS NULL THEN
        RETURN;
    END IF;
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.room_reports'::regclass AND con.contype = 'f' AND att.attname = 'reviewer_id'
    LIMIT 1;
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.room_reports DROP CONSTRAINT %I', constraint_name);
    END IF;
    ALTER TABLE public.room_reports
        ADD CONSTRAINT room_reports_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users (id) ON DELETE SET NULL;
END $$;
