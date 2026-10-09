#!/usr/bin/env bash
# Stops the backend, JWKS server, and web app started by start.sh or start-supabase.sh. PostgreSQL is left running.
set -uo pipefail
STATE="$(cd "$(dirname "$0")/../.." && pwd)/.local-dev"
for name in backend jwks expo; do
  if [ -f "$STATE/$name.pid" ]; then
    kill "$(cat "$STATE/$name.pid")" 2>/dev/null && echo "Stopped $name"
    rm -f "$STATE/$name.pid"
  fi
done
