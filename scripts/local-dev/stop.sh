#!/usr/bin/env bash
# Stops what start.sh / start-supabase.sh started (backend, local auth server, web app). PostgreSQL is left running.
# Usage: scripts/local-dev/stop.sh [backend|jwks|expo ...]   (default: all three)
set -uo pipefail
STATE="$(cd "$(dirname "$0")/../.." && pwd)/.local-dev"
names=("$@")
[ ${#names[@]} -eq 0 ] && names=(backend jwks expo)
for name in "${names[@]}"; do
  if [ -f "$STATE/$name.pid" ]; then
    kill "$(cat "$STATE/$name.pid")" 2>/dev/null && echo "Stopped $name"
    rm -f "$STATE/$name.pid"
  fi
done
