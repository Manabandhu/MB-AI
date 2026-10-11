---
name: manabandhu-migration
description: Write and verify a Flyway migration for the ManaBandhu Supabase Postgres database — append-only versioning, row level security, Supabase-only guards, entity mapping, and testing on a fresh local database. Use for any schema, constraint, index, function, RLS, or seed-data change.
---

# Database migrations

Migrations live in `backend/src/main/resources/db/migration/` and run on backend startup (and through the `migrate`
workflow, which baselines existing Supabase schemas at version 0).

## Rules

1. **Append only.** Never edit or rename an applied `V<n>__*.sql`; add `V<next>__short_description.sql`. Check the
   highest version with `ls backend/src/main/resources/db/migration | sort -V | tail -1`.
2. **Every new table:**
   ```sql
   ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
   DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
       REVOKE ALL ON TABLE public.my_table FROM anon, authenticated;
     END IF;
   END $$;
   ```
   The backend connects as the table owner and is unaffected. Only add a policy (and matching GRANT) when the app
   genuinely reads the table directly through Supabase (today: onboarding config/progress, chat realtime on
   `messages`).
3. **`SECURITY DEFINER` functions** must declare `SET search_path = public, pg_temp` and `REVOKE ALL ... FROM PUBLIC`.
4. **Supabase-only objects** (`auth.uid()`, `realtime.*`, the `supabase_realtime` publication) go inside guards such as
   `IF to_regprocedure('auth.uid()') IS NOT NULL THEN ... END IF;` so the migration also runs locally and in tests.
5. **PostGIS lives in the `extensions` schema** (V38 moved it out of `public` so `spatial_ref_sys` is not exposed
   through PostgREST). Qualify calls and types in new SQL: `extensions.st_geogfromtext(...)`,
   `extensions.geography(Point, 4326)`. Never `create extension` into `public`.
6. **Constraints and code agree.** If you add a `CHECK (status IN (...))`, the Java code must write exactly those values.
   Normalize existing rows before tightening a constraint.
7. **Idempotent where cheap:** `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP POLICY IF EXISTS`.
8. **Entities:** map new columns on the JPA entity (Hibernate runs with `ddl-auto: validate`, so a missing or mistyped
   column fails startup). Columns the app should not write use `insertable = false, updatable = false`.
9. Foreign keys to `auth.users(id)` mean you must never insert placeholder UUIDs; make the column nullable instead.

## Verify on a fresh database

```bash
scripts/local-dev/start.sh --reset --build     # applies every migration from V1 and validates entities
grep -E "Successfully applied|ERROR" .local-dev/backend.log
```

Find public tables without RLS (should return no rows):

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d manabandhu -c \
  "select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
     and relname not in ('flyway_schema_history', 'spatial_ref_sys');"
```

When the real Supabase project is active, also run the Supabase MCP `get_advisors` (type `security`) after applying the
migration there, and fix every RLS/search_path finding.

Update `.codex/skills/manabandhu-backend-api/SKILL.md` (and the owning module's skill) in the same commit.
