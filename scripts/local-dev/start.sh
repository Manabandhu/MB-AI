#!/usr/bin/env bash
# OPTIONAL offline stack, used only for the authorization smoke test (authz-smoke.mjs needs locally minted logins
# that Supabase rejects). Day-to-day development runs against Supabase: `pnpm dev:backend` or start-supabase.sh.
# Starts the full backend stack locally without Supabase:
#   PostgreSQL (must already be running, with PostGIS installed) -> database + Supabase stand-ins + test users
#   local JWKS server -> Spring Boot backend on :8080 (all Flyway migrations apply on startup)
#
# Usage: scripts/local-dev/start.sh [--reset] [--build]
#   --reset  drop and recreate the local database first
#   --build  rebuild the backend jar even if one exists
# Env: PGHOST (localhost) PGPORT (5432) PGUSER (postgres) PGPASSWORD (postgres) LOCAL_DB (manabandhu)
#      JAVA_HOME (defaults to a Java 25 install under /usr/lib/jvm when present)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE="$ROOT/.local-dev"
mkdir -p "$STATE"
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}" PGPASSWORD="${PGPASSWORD:-postgres}"
DB="${LOCAL_DB:-manabandhu}"
RESET=false BUILD=false
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=true ;;
    --build) BUILD=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL is not installed. It is only needed for this optional offline stack;" >&2
  echo "install postgresql-16 and postgresql-16-postgis-3 (sudo apt-get install -y ...) or use start-supabase.sh." >&2
  exit 1
fi

# The backend targets Java 25; fall back to a Java 25 install when JAVA_HOME points at an older JDK.
java_major() { "${1:+$1/bin/}java" -version 2>&1 | sed -nE 's/.*version "([0-9]+).*/\1/p' | head -1; }
if [ "$(java_major "${JAVA_HOME:-}")" != "25" ]; then
  for candidate in /usr/lib/jvm/java-25-openjdk-amd64 /usr/lib/jvm/temurin-25* /opt/java/openjdk; do
    if [ -x "$candidate/bin/java" ] && [ "$(java_major "$candidate")" = "25" ]; then export JAVA_HOME="$candidate"; break; fi
  done
fi
[ "$(java_major "${JAVA_HOME:-}")" = "25" ] || { echo "Java 25 is required (set JAVA_HOME)." >&2; exit 1; }

if ! psql -d postgres -qtAc 'select 1' >/dev/null 2>&1; then
  echo "Cannot reach PostgreSQL at $PGHOST:$PGPORT as $PGUSER. Start it first (e.g. 'sudo service postgresql start')." >&2
  exit 1
fi

if $RESET; then
  "$ROOT/scripts/local-dev/stop.sh" backend jwks >/dev/null 2>&1 || true
  psql -d postgres -qc "DROP DATABASE IF EXISTS $DB;"
  # Accounts created through the local Supabase Auth stand-in live in the dropped database too.
  rm -f "$STATE/auth-users.json"
fi
if ! psql -d postgres -qtAc "select 1 from pg_database where datname = '$DB'" | grep -q 1; then
  psql -d postgres -qc "CREATE DATABASE $DB;"
fi
psql -d "$DB" -q -f "$ROOT/scripts/local-dev/supabase-stub.sql" 2>/dev/null
# Fixed test users referenced by authz-smoke.mjs: A (driver/owner), B (rider/member), C (stranger), D (admin).
psql -d "$DB" -qc "insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'c@example.test'),
  ('44444444-4444-4444-4444-444444444444', 'admin@example.test')
  on conflict (id) do nothing;"

if ! curl -sf http://localhost:9999/jwks.json >/dev/null 2>&1; then
  nohup node "$ROOT/scripts/local-dev/auth.mjs" serve >"$STATE/jwks.log" 2>&1 &
  echo $! >"$STATE/jwks.pid"
fi

JAR="$(ls "$ROOT"/backend/target/backend-*.jar 2>/dev/null | head -1 || true)"
if $BUILD || [ -z "$JAR" ]; then
  (cd "$ROOT/backend" && ./mvnw -q -B package -DskipTests)
  JAR="$(ls "$ROOT"/backend/target/backend-*.jar | head -1)"
fi

if curl -sf http://localhost:8080/api/v1/health >/dev/null 2>&1; then
  echo "Backend already running on :8080 (run stop.sh first to restart it)."
else
  DATABASE_URL="jdbc:postgresql://$PGHOST:$PGPORT/$DB" DATABASE_USERNAME="$PGUSER" DATABASE_PASSWORD="$PGPASSWORD" \
  SUPABASE_JWKS_URI=http://localhost:9999/jwks.json SUPABASE_JWT_ISSUER=http://localhost:9999/auth/v1 \
  SUPABASE_PROJECT_URL= SUPABASE_SERVICE_ROLE_KEY= \
    nohup "${JAVA_HOME:+$JAVA_HOME/bin/}java" -jar "$JAR" >"$STATE/backend.log" 2>&1 &
  echo $! >"$STATE/backend.pid"
  for _ in $(seq 1 90); do
    curl -sf http://localhost:8080/api/v1/health >/dev/null 2>&1 && break
    if ! kill -0 "$(cat "$STATE/backend.pid")" 2>/dev/null; then
      echo "Backend exited during startup; see $STATE/backend.log" >&2
      tail -20 "$STATE/backend.log" >&2
      exit 1
    fi
    sleep 2
  done
fi

curl -sf http://localhost:8080/api/v1/health >/dev/null || { echo "Backend did not become healthy; see $STATE/backend.log" >&2; exit 1; }
# Seed reference data the smoke suite needs (tables exist only after the backend ran the migrations).
psql -d "$DB" -qc "insert into public.event_categories (name) select 'Festivals' where not exists (select 1 from public.event_categories);"
echo "Backend ready on http://localhost:8080 (logs: .local-dev/backend.log)"
echo "Mint a token:  node scripts/local-dev/auth.mjs mint 11111111-1111-1111-1111-111111111111"
echo "Run checks:    node scripts/local-dev/authz-smoke.mjs"
