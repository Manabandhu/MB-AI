#!/usr/bin/env bash
# Starts the backend and the Expo web app against the hosted Supabase project instead of local PostgreSQL:
#   Supabase Postgres (through the connection pooler) + Supabase Auth JWKS -> backend on :8080 -> web app on :8081
#
# Usage: scripts/local-dev/start-supabase.sh [--no-migrate] [--build]
#   --no-migrate  start without running Flyway, so the hosted schema is left untouched
#   --build       rebuild the backend jar even if one exists
# Required env:  DATABASE_PASSWORD                    (environment secret; never commit it)
#                EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (publishable key, safe for clients)
# Optional env:  SUPABASE_PROJECT_REF (lpzaioyurvgdysdfktzc)  SUPABASE_POOLER_HOST (aws-0-us-east-2.pooler.supabase.com)
#
# Starting without --no-migrate applies any pending Flyway migrations to the hosted database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE="$ROOT/.local-dev"
mkdir -p "$STATE"
REF="${SUPABASE_PROJECT_REF:-lpzaioyurvgdysdfktzc}"
POOLER="${SUPABASE_POOLER_HOST:-aws-0-us-east-2.pooler.supabase.com}"
MIGRATE=true BUILD=false
for arg in "$@"; do
  case "$arg" in
    --no-migrate) MIGRATE=false ;;
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

# Session-mode pooler (port 5432) keeps prepared statements working for Hibernate and Flyway.
DATABASE_URL="jdbc:postgresql://$POOLER:5432/postgres?sslmode=require" \
DATABASE_USERNAME="postgres.$REF" \
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
