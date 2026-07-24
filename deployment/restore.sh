#!/usr/bin/env bash
# restore.sh — interactively restore a backup created by backup.sh.
#
# Usage:
#   deployment/restore.sh [--env development|demo|production]
#   deployment/restore.sh --backup backups/2026-07-02-1500 --yes   # non-interactive/CPOS
#   deployment/restore.sh --dry-run [--backup <dir>]               # show the plan, touch nothing
#
# This is destructive (overwrites the current database and media storage),
# so outside of --dry-run it always requires typed confirmation unless -y/--yes
# is passed.

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

parse_common_flags "$@"
set -- "${REMAINING_ARGS[@]}"

BACKUP_CHOICE=""
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup) BACKUP_CHOICE="$2"; shift 2 ;;
    --backup=*) BACKUP_CHOICE="${1#--backup=}"; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

validate_deploy_env
load_env
detect_compose_cmd

log_step "Leinaflow restore (env: ${DEPLOY_ENV})"

# ── Select a backup ──────────────────────────────────────────────────────
if [[ -z "${BACKUP_CHOICE}" ]]; then
  if [[ ! -d "${BACKUP_DIR}" ]] || [[ -z "$(ls -A "${BACKUP_DIR}" 2>/dev/null)" ]]; then
    log_err "No backups found in ${BACKUP_DIR}."
    exit 1
  fi

  mapfile -t BACKUPS < <(find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d | sort -r)
  if [[ "${#BACKUPS[@]}" -eq 0 ]]; then
    log_err "No backups found in ${BACKUP_DIR}."
    exit 1
  fi

  echo "Available backups (newest first):"
  for i in "${!BACKUPS[@]}"; do
    printf '  %2d) %s\n' "$((i + 1))" "$(basename "${BACKUPS[$i]}")"
  done

  if [[ "${ASSUME_YES}" == "1" ]]; then
    BACKUP_CHOICE="${BACKUPS[0]}"
    log_info "Non-interactive mode: using the most recent backup: $(basename "${BACKUP_CHOICE}")"
  else
    [[ -t 0 ]] || { log_err "No backup selected and not a TTY — pass --backup <dir> or --yes."; exit 1; }
    read -r -p "Select a backup to restore [1-${#BACKUPS[@]}]: " selection
    if ! [[ "${selection}" =~ ^[0-9]+$ ]] || (( selection < 1 || selection > ${#BACKUPS[@]} )); then
      log_err "Invalid selection: ${selection}"
      exit 1
    fi
    BACKUP_CHOICE="${BACKUPS[$((selection - 1))]}"
  fi
else
  [[ "${BACKUP_CHOICE}" = /* ]] || BACKUP_CHOICE="${BACKUP_DIR}/${BACKUP_CHOICE}"
fi

[[ -d "${BACKUP_CHOICE}" ]] || { log_err "Backup directory not found: ${BACKUP_CHOICE}"; exit 1; }
log_info "Selected backup: ${BACKUP_CHOICE}"
[[ -f "${BACKUP_CHOICE}/manifest.txt" ]] && cat "${BACKUP_CHOICE}/manifest.txt"

DB_DUMP="${BACKUP_CHOICE}/db.sql"
MEDIA_ARCHIVE="${BACKUP_CHOICE}/media.tar.gz"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  log_step "Dry run — no changes will be made"
  echo "Would stop services:  ${COMPOSE} $(compose_files) stop backend frontend"
  [[ -f "${DB_DUMP}" ]] && echo "Would restore database from: ${DB_DUMP}" || echo "No db.sql in this backup — database restore would be skipped."
  [[ -f "${MEDIA_ARCHIVE}" ]] && echo "Would restore media from: ${MEDIA_ARCHIVE}" || echo "No media.tar.gz in this backup — media restore would be skipped."
  echo "Would restart services and run healthcheck.sh --env ${DEPLOY_ENV}"
  exit 0
fi

confirm_typed "This will OVERWRITE the current database and media storage from ${BACKUP_CHOICE}." "restore" || {
  log_info "Restore cancelled."
  exit 1
}

log_step "1. Stopping application services"
dc stop backend frontend 2>/dev/null || true

if [[ -f "${DB_DUMP}" ]]; then
  log_step "2. Restoring database"
  dc up -d postgres
  # Ensure postgres is accepting connections before piping the dump in.
  for _ in $(seq 1 30); do
    dc exec -T postgres pg_isready -U "${POSTGRES_USER:-creator_admin}" >/dev/null 2>&1 && break
    sleep 2
  done
  dc exec -T postgres psql -U "${POSTGRES_USER:-creator_admin}" -d "${POSTGRES_DB:-creator_platform}" -v ON_ERROR_STOP=1 < "${DB_DUMP}"
  log_ok "Database restored."
else
  log_warn "No db.sql in this backup — skipping database restore."
fi

if [[ -f "${MEDIA_ARCHIVE}" ]]; then
  log_step "3. Restoring media storage"
  docker volume inspect "${RESOURCE_PREFIX}-media-storage" >/dev/null 2>&1 || docker volume create "${RESOURCE_PREFIX}-media-storage" >/dev/null
  docker run --rm \
    -v "${RESOURCE_PREFIX}-media-storage:/data" \
    -v "${BACKUP_CHOICE}:/backup:ro" \
    alpine:3 \
    sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null; tar xzf /backup/media.tar.gz -C /data"
  log_ok "Media storage restored."
else
  log_warn "No media.tar.gz in this backup — skipping media restore."
fi

log_step "4. Restarting services"
dc up -d

log_info "Waiting for backend/frontend to finish booting..."
wait_for_http_ok backend "http://localhost:4000/v1/health" 90 || log_warn "Backend did not respond within 90s — see the health check below."
wait_for_http_ok frontend "http://localhost:3000" 90 || log_warn "Frontend did not respond within 90s — see the health check below."

log_step "5. Verifying health"
"${DEPLOYMENT_DIR}/healthcheck.sh" --env "${DEPLOY_ENV}"

log_ok "Restore complete from ${BACKUP_CHOICE}."
