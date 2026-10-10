#!/usr/bin/env bash
# Starts the backend and the Expo web app against the hosted Supabase project instead of local PostgreSQL:
#   Supabase Postgres (through the connection pooler) + Supabase Auth JWKS -> backend on :8080 -> web app on :8081
#
# Usage: scripts/local-dev/start-supabase.sh [--migrate] [--build]
#   --migrate  also apply pending Flyway migrations to the hosted database (off by default: local and sandbox runs
#              leave the hosted schema alone; the deployed backend and the `migrate` workflow apply migrations)
#   --build    rebuild the backend jar even if one exists
# Required env:  DATABASE_PASSWORD                    (environment secret; never commit it)
#                EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (publishable key, safe for clients)
# Optional env:  SUPABASE_PROJECT_REF (lpzaioyurvgdysdfktzc)  SUPABASE_POOLER_HOST (aws-0-us-east-2.pooler.supabase.com)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE="$ROOT/.local-dev"
mkdir -p "$STATE"
REF="${SUPABASE_PROJECT_REF:-lpzaioyurvgdysdfktzc}"
POOLER="${SUPABASE_POOLER_HOST:-aws-0-us-east-2.pooler.supabase.com}"
MIGRATE=false BUILD=false
for arg in "$@"; do
  case "$arg" in
    --migrate) MIGRATE=true ;;
    --no-migrate) MIGRATE=false ;; # the default; accepted for older instructions
    --build) BUILD=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

: "${DATABASE_PASSWORD:?Set DATABASE_PASSWORD as an environment secret (Supabase database password).}"
: "${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Supabase publishable key).}"

if ! curl -s -o /dev/null -m 8 "https://$REF.supabase.co/auth/v1/health"; then
  echo "Cannot reach https://$REF.supabase.co. Allow *.supabase.co and *.pooler.supabase.com in the network settings." >&2
  exit 1
fi

# The backend talks to Postgres through the pooler over TCP 5432, which an HTTPS-only network blocks even when the
# Auth check above passes; fail here with a clear message instead of a JDBC stack trace.
if ! timeout 8 bash -c 'exec 3<>/dev/tcp/$1/5432' _ "$POOLER" 2>/dev/null; then
  echo "Cannot open a connection to $POOLER:5432. Check SUPABASE_POOLER_HOST (Supabase → Connect) and that the network" >&2
  echo "allows outbound TCP to *.pooler.supabase.com." >&2
  exit 1
fi

java_major() { "${1:+$1/bin/}java" -version 2>&1 | sed -nE 's/.*version "([0-9]+).*/\1/p' | head -1; }
if [ "$(java_major "${JAVA_HOME:-}")" != "25" ]; then
  for candidate in /usr/lib/jvm/java-25-openjdk-amd64 /usr/lib/jvm/temurin-25* /opt/java/openjdk; do
    if [ -x "$candidate/bin/java" ] && [ "$(java_major "$candidate")" = "25" ]; then export JAVA_HOME="$candidate"; break; fi
  done
fi
[ "$(java_major "${JAVA_HOME:-}")" = "25" ] || { echo "Java 25 is required (set JAVA_HOME)." >&2; exit 1; }

JAR="$(ls "$ROOT"/backend/target/backend-*.jar 2>/dev/null | head -1 || true)"
if $BUILD || [ -z "$JAR" ]; then
  (cd "$ROOT/backend" && ./mvnw -q -B clean package -DskipTests)
  JAR="$(ls "$ROOT"/backend/target/backend-*.jar | head -1)"
fi

if curl -sf http://localhost:8080/api/v1/health >/dev/null 2>&1; then
  echo "A backend is already running on :8080; run scripts/local-dev/stop.sh first." >&2
  exit 1
fi

# Session-mode pooler (port 5432) keeps prepared statements working for Hibernate (and Flyway with --migrate).
DATABASE_URL="jdbc:postgresql://$POOLER:5432/postgres?sslmode=require" \
DATABASE_USERNAME="${DATABASE_USERNAME:-manabandhu_app.$REF}" \
SPRING_FLYWAY_ENABLED="$MIGRATE" \
SUPABASE_JWKS_URI="https://$REF.supabase.co/auth/v1/.well-known/jwks.json" \
SUPABASE_JWT_ISSUER="https://$REF.supabase.co/auth/v1" \
CORS_ALLOWED_ORIGINS="http://localhost:8081" \
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
curl -sf http://localhost:8080/api/v1/health >/dev/null || { echo "Backend did not become healthy; see $STATE/backend.log" >&2; exit 1; }

(cd "$ROOT/frontend" && CI=1 BROWSER=none EXPO_PUBLIC_API_URL=http://localhost:8080 \
  EXPO_PUBLIC_SUPABASE_URL="https://$REF.supabase.co" \
  nohup npx expo start --web --port 8081 >"$STATE/expo.log" 2>&1 &
  echo $! >"$STATE/expo.pid")
echo "Backend on http://localhost:8080 using Supabase project $REF (migrations: $MIGRATE)."
echo "Web app starting on http://localhost:8081 (first load compiles the bundle). Sign in with a real account."
