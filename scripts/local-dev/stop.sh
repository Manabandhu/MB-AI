#!/usr/bin/env bash
# Stops the backend and JWKS server started by start.sh. PostgreSQL is left running.
set -uo pipefail
STATE="$(cd "$(dirname "$0")/../.." && pwd)/.local-dev"
for name in backend jwks; do
  if [ -f "$STATE/$name.pid" ]; then
    kill "$(cat "$STATE/$name.pid")" 2>/dev/null && echo "Stopped $name"
    rm -f "$STATE/$name.pid"
  fi
done
