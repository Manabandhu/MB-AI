#!/bin/bash
# Prepares a Claude Code cloud session so lint, typecheck, tests, and the local stack work immediately.
# Idempotent; the container is cached after this completes, so later sessions start fast.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# JavaScript workspace (Biome, TypeScript, Expo, node --test).
corepack enable >/dev/null 2>&1 || true
pnpm install --prefer-offline

# Backend: Java 25 (the Maven build targets release 25) and PostgreSQL + PostGIS for scripts/local-dev.
SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then SUDO="sudo -n"; fi
missing=()
[ -x /usr/lib/jvm/java-25-openjdk-amd64/bin/java ] || missing+=(openjdk-25-jdk-headless)
command -v psql >/dev/null 2>&1 || missing+=(postgresql)
dpkg -s postgresql-16-postgis-3 >/dev/null 2>&1 || missing+=(postgresql-16-postgis-3)
if [ ${#missing[@]} -gt 0 ]; then
  if $SUDO apt-get update -qq && DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq "${missing[@]}"; then
    echo "Installed: ${missing[*]}"
  else
    echo "Warning: could not install ${missing[*]}; backend build or local stack may be unavailable." >&2
  fi
fi

if [ -x /usr/lib/jvm/java-25-openjdk-amd64/bin/java ]; then
  echo 'export JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64' >> "${CLAUDE_ENV_FILE:-/dev/null}"
  # Warm the Maven cache so `./mvnw -o test` works without fetching.
  (cd backend && JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64 ./mvnw -q -B dependency:go-offline >/dev/null 2>&1) \
    || echo "Warning: Maven dependency pre-fetch failed; the first backend build will download dependencies." >&2
fi

# Local database user for scripts/local-dev/start.sh (password matches its default).
if command -v pg_ctlcluster >/dev/null 2>&1; then
  $SUDO service postgresql start >/dev/null 2>&1 || true
  $SUDO su postgres -c "psql -qc \"ALTER USER postgres PASSWORD 'postgres';\"" >/dev/null 2>&1 || true
fi
