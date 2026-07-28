#!/usr/bin/env bash
# backup.sh — snapshot PostgreSQL, media storage, environment files and
# deployment configuration into backups/YYYY-MM-DD-HHMM/.
#
# Usage: deployment/backup.sh [--env development|demo|production]
# Prints the resulting backup directory path on the last line on success,
# so callers (including the Cloudivo Operations Center, COC) can capture it: `dir=$(deployment/backup.sh --env production | tail -1)`

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

parse_common_flags "$@"
validate_deploy_env
load_env
detect_compose_cmd

TIMESTAMP="$(date +%Y-%m-%d-%H%M)"
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"

log_step "Leinaflow backup (env: ${DEPLOY_ENV}) -> ${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

# ── PostgreSQL ───────────────────────────────────────────────────────────
if service_running postgres; then
  log_info "Dumping PostgreSQL database..."
  # --clean --if-exists makes the dump idempotent to restore: it emits
  # DROP ... IF EXISTS before each CREATE, so restore.sh works the same way
  # whether it's applied to an empty database or one that already has the
  # current schema (otherwise CREATE TYPE/TABLE fails with "already exists").
  dc exec -T postgres pg_dump --clean --if-exists -U "${POSTGRES_USER:-creator_admin}" "${POSTGRES_DB:-creator_platform}" > "${TARGET_DIR}/db.sql"
  log_ok "Database dumped: ${TARGET_DIR}/db.sql ($(du -h "${TARGET_DIR}/db.sql" | cut -f1))"
else
  log_warn "postgres container not running — skipping database dump."
fi

# ── Media storage ────────────────────────────────────────────────────────
if docker volume inspect "${RESOURCE_PREFIX}-media-storage" >/dev/null 2>&1; then
  log_info "Archiving media storage volume..."
  docker run --rm \
    -v "${RESOURCE_PREFIX}-media-storage:/data:ro" \
    -v "${TARGET_DIR}:/backup" \
    alpine:3 \
    tar czf /backup/media.tar.gz -C /data .
  log_ok "Media archived: ${TARGET_DIR}/media.tar.gz ($(du -h "${TARGET_DIR}/media.tar.gz" | cut -f1))"
else
  log_warn "${RESOURCE_PREFIX}-media-storage volume does not exist — skipping media backup."
fi

# ── Environment ──────────────────────────────────────────────────────────
log_info "Copying environment files..."
mkdir -p "${TARGET_DIR}/env"
for f in .env .env.production; do
  [[ -f "${PROJECT_ROOT}/${f}" ]] && cp "${PROJECT_ROOT}/${f}" "${TARGET_DIR}/env/${f}"
done
log_ok "Environment files copied."

# ── Configuration ────────────────────────────────────────────────────────
log_info "Copying deployment configuration..."
mkdir -p "${TARGET_DIR}/config"
for item in compose.yml compose.dev.yml compose.demo.yml compose.prod.yml docker; do
  [[ -e "${PROJECT_ROOT}/${item}" ]] && cp -r "${PROJECT_ROOT}/${item}" "${TARGET_DIR}/config/"
done
log_ok "Configuration copied."

# Record what env/compose files produced this backup, for restore.sh.
cat > "${TARGET_DIR}/manifest.txt" <<EOF
created_at=$(date -Iseconds)
deploy_env=${DEPLOY_ENV}
compose_files=$(compose_files)
EOF

log_step "Backup complete"
log_ok "$(du -sh "${TARGET_DIR}" | cut -f1) total in ${TARGET_DIR}"
echo "${TARGET_DIR}"
