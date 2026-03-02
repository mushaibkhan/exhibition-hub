#!/usr/bin/env bash
# Start production stack (runs deploy/run.sh from repo root).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "$ROOT/deploy/run.sh" "$@"
