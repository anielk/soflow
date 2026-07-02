#!/usr/bin/env bash
# uninstall.sh — stop and remove Leinaflow's containers.
#
# By default this only stops/removes containers and networks. Data is kept:
#   - Named volumes (postgres/redis/media) are kept unless --remove-volumes.
#   - backups/ is always kept unless --delete-backups.
#
# Usage:
#   deployment/uninstall.sh [--env development|demo|production]
#   deployment/uninstall.sh --remove-volumes --delete-backups --yes   # full wipe, non-interactive
#   deployment/uninstall.sh --dry-run

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

parse_common_flags "$@"
set -- "${REMAINING_ARGS[@]}"

REMOVE_VOLUMES=0
DELETE_BACKUPS=0
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --remove-volumes) REMOVE_VOLUMES=1; shift ;;
    --delete-backups) DELETE_BACKUPS=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

validate_deploy_env
load_env
detect_compose_cmd

log_step "Leinaflow uninstall (env: ${DEPLOY_ENV})"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "Would run: ${COMPOSE} $(compose_files) down"
  if [[ "${REMOVE_VOLUMES}" -eq 1 ]]; then
    echo "Would also remove volumes: creator-postgres-data, creator-redis-data, creator-media-storage"
  else
    echo "Volumes would be KEPT (pass --remove-volumes to remove them)."
  fi
  if [[ "${DELETE_BACKUPS}" -eq 1 ]]; then
    echo "Would also delete: ${BACKUP_DIR}"
  else
    echo "Backups would be KEPT at ${BACKUP_DIR} (pass --delete-backups to remove them)."
  fi
  exit 0
fi

confirm "Stop and remove all Leinaflow containers for env '${DEPLOY_ENV}'?" || { log_info "Cancelled."; exit 1; }

log_step "1. Stopping and removing containers"
dc down
log_ok "Containers stopped and removed."

if [[ "${REMOVE_VOLUMES}" -eq 1 ]]; then
  if confirm_typed "This permanently deletes the database, cache and all media files." "delete"; then
    for vol in creator-postgres-data creator-redis-data creator-media-storage; do
      if docker volume inspect "${vol}" >/dev/null 2>&1; then
        docker volume rm "${vol}" >/dev/null
        log_ok "Removed volume: ${vol}"
      fi
    done
  else
    log_info "Volume removal cancelled — data volumes were kept."
  fi
else
  log_info "Data volumes kept (postgres, redis, media). Pass --remove-volumes to remove them."
fi

if [[ "${DELETE_BACKUPS}" -eq 1 ]]; then
  if confirm_typed "This permanently deletes every backup under ${BACKUP_DIR}." "delete"; then
    rm -rf "${BACKUP_DIR}"
    log_ok "Backups deleted: ${BACKUP_DIR}"
  else
    log_info "Backup deletion cancelled — backups were kept."
  fi
else
  log_info "Backups kept at ${BACKUP_DIR}. Pass --delete-backups to remove them."
fi

log_ok "Uninstall complete."
