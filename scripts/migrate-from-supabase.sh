#!/bin/bash
# ==========================================================
# Data Migration Script: Supabase → Self-Managed PostgreSQL
# ==========================================================
#
# Prerequisites:
#   - pg_dump and psql must be available
#   - Docker containers must be running (docker compose up -d)
#
# Usage:
#   1. Set your Supabase DB credentials below
#   2. Run: bash scripts/migrate-from-supabase.sh
# ==========================================================

set -euo pipefail

# --- Configuration ---
# Replace these with your Supabase database credentials
SUPABASE_HOST="${SUPABASE_HOST:-db.oxslcbsnaztxhkjepfgp.supabase.co}"
SUPABASE_USER="${SUPABASE_USER:-postgres}"
SUPABASE_DB="${SUPABASE_DB:-postgres}"
SUPABASE_PORT="${SUPABASE_PORT:-5432}"

# Local Docker PostgreSQL
LOCAL_CONTAINER="${LOCAL_CONTAINER:-exhibition-hub-postgres-1}"
LOCAL_USER="app_user"
LOCAL_DB="exhibition_hub"

EXPORT_FILE="data_export.sql"

echo "============================================"
echo "  Supabase → PostgreSQL Data Migration"
echo "============================================"
echo ""

# Step 1: Export from Supabase
echo "[1/4] Exporting data from Supabase..."
echo "  Host: $SUPABASE_HOST"
echo "  You will be prompted for the Supabase database password."
echo ""

pg_dump --data-only --inserts \
  -h "$SUPABASE_HOST" \
  -U "$SUPABASE_USER" \
  -d "$SUPABASE_DB" \
  -p "$SUPABASE_PORT" \
  --schema=public \
  -t exhibitions \
  -t accounts \
  -t profiles \
  -t user_roles \
  -t stalls \
  -t stall_layouts \
  -t leads \
  -t services \
  -t transactions \
  -t transaction_items \
  -t payments \
  -t service_allocations \
  -t expenses \
  -t internal_ledger \
  > "$EXPORT_FILE"

echo "  Exported to $EXPORT_FILE"

# Step 2: Clean the export
echo ""
echo "[2/4] Cleaning export file..."

# Remove Supabase-specific lines
sed -i.bak \
  -e '/^SET /d' \
  -e '/^SELECT pg_catalog/d' \
  -e '/^-- Dumped by/d' \
  -e '/^-- PostgreSQL database dump/d' \
  -e '/auth\./d' \
  -e '/^--$/d' \
  "$EXPORT_FILE"

# Remove backup
rm -f "${EXPORT_FILE}.bak"

echo "  Cleaned $EXPORT_FILE"

# Step 3: Import into Docker PostgreSQL
echo ""
echo "[3/4] Importing into local PostgreSQL container..."

# Clear existing seed data first (to avoid conflicts)
docker exec -i "$LOCAL_CONTAINER" psql -U "$LOCAL_USER" -d "$LOCAL_DB" -c "
  TRUNCATE internal_ledger, expenses, service_allocations, payments,
           transaction_items, transactions, services, leads, stall_layouts,
           stalls, user_roles, profiles, accounts, exhibitions CASCADE;
" 2>/dev/null || true

# Import
docker exec -i "$LOCAL_CONTAINER" psql -U "$LOCAL_USER" -d "$LOCAL_DB" < "$EXPORT_FILE"

echo "  Import complete"

# Step 4: Verify row counts
echo ""
echo "[4/4] Verifying row counts..."
echo ""

TABLES="exhibitions accounts profiles user_roles stalls stall_layouts leads services transactions transaction_items payments service_allocations expenses internal_ledger"

printf "%-25s %s\n" "TABLE" "ROWS"
printf "%-25s %s\n" "-------------------------" "-----"

for table in $TABLES; do
  count=$(docker exec "$LOCAL_CONTAINER" psql -U "$LOCAL_USER" -d "$LOCAL_DB" -tAc "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "ERROR")
  printf "%-25s %s\n" "$table" "$count"
done

echo ""
echo "============================================"
echo "  Migration complete!"
echo "  Review the counts above to verify."
echo "============================================"

# Cleanup
rm -f "$EXPORT_FILE"
echo "  Cleaned up $EXPORT_FILE"
