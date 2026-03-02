#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.production}"
cd "$ROOT"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy deploy/.env.production.example to .env.production and set DB_PASSWORD, JWT_SECRET."
  exit 1
fi
docker compose -f deploy/docker-compose.production.yml --env-file "$ENV_FILE" up -d
