#!/bin/bash
# Prepares a Claude Code cloud session so lint, typecheck, and tests work immediately. The app runs against the
# hosted Supabase database (scripts/local-dev/start-supabase.sh); no local PostgreSQL is installed.
# Idempotent; the container is cached after this completes, so later sessions start fast.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# JavaScript workspace (Biome, TypeScript, Expo, node --test).
corepack enable >/dev/null 2>&1 || true
pnpm install --prefer-offline

# Backend: Java 25 (the Maven build targets release 25). Backend tests use an in-memory H2 database.
SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then SUDO="sudo -n"; fi
missing=()
[ -x /usr/lib/jvm/java-25-openjdk-amd64/bin/java ] || missing+=(openjdk-25-jdk-headless)
if [ ${#missing[@]} -gt 0 ]; then
  if $SUDO apt-get update -qq && DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq "${missing[@]}"; then
    echo "Installed: ${missing[*]}"
  else
    echo "Warning: could not install ${missing[*]}; backend build may be unavailable." >&2
  fi
fi

if [ -x /usr/lib/jvm/java-25-openjdk-amd64/bin/java ]; then
  echo 'export JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64' >> "${CLAUDE_ENV_FILE:-/dev/null}"
  # Warm the Maven cache so `./mvnw -o test` works without fetching.
  (cd backend && JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64 ./mvnw -q -B dependency:go-offline >/dev/null 2>&1) \
    || echo "Warning: Maven dependency pre-fetch failed; the first backend build will download dependencies." >&2
fi
