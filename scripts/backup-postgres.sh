#!/bin/bash
# ==========================================================
# PostgreSQL Backup Script
# ==========================================================
# Usage:
#   bash scripts/backup-postgres.sh
#
# Backups are stored in ./backups/ with timestamp names.
# Keeps the last 7 backups by default.
# ==========================================================

set -euo pipefail

# Production: same name when compose run from root with -f deploy/docker-compose.production.yml
CONTAINER="${PG_CONTAINER:-exhibition-hub-postgres-1}"
DB_USER="app_user"
DB_NAME="exhibition_hub"
BACKUP_DIR="./backups"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/exhibition_hub_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup complete: $BACKUP_FILE ($SIZE)"

# Prune old backups
echo "[$(date)] Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "exhibition_hub_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true

REMAINING=$(find "$BACKUP_DIR" -name "exhibition_hub_*.sql.gz" | wc -l)
echo "[$(date)] $REMAINING backups retained."
