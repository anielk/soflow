#!/usr/bin/env bash
# install.sh — install Leinaflow on a clean (or partially set up) Linux host.
#
# Idempotent: every step checks whether it's already satisfied before acting,
# so re-running this script on a host that's already installed just verifies
# and reconciles rather than failing or duplicating work.
#
# Usage:
#   deployment/install.sh [--env development|demo|production] [-y|--yes] [--seed|--no-seed]
#
# Flags:
#   --env <env>   Target environment (default: production). Each environment
#                 layers compose.yml with its own overlay: compose.dev.yml,
#                 compose.demo.yml, or compose.prod.yml (demo/production are
#                 functionally identical — see docs/deployment/Architecture.md).
#   -y, --yes     Non-interactive: accept all prompts (for COC/scripted runs).
#   --seed        Force-run the database seed even on production.
#   --no-seed     Skip seeding even on development/demo.
#                 (default: seed on development/demo, skip on production —
#                  the seed creates known demo credentials.)

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

parse_common_flags "$@"
set -- "${REMAINING_ARGS[@]}"

SEED_MODE="auto" # auto | force | skip
while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed) SEED_MODE="force"; shift ;;
    --no-seed) SEED_MODE="skip"; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

validate_deploy_env

should_seed() {
  case "${SEED_MODE}" in
    force) return 0 ;;
    skip) return 1 ;;
    auto) [[ "${DEPLOY_ENV}" != "production" ]] ;;
  esac
}

create_folders() {
  log_step "6. Creating required folders"
  mkdir -p "${BACKUP_DIR}"
  log_ok "Backup directory ready: ${BACKUP_DIR}"

  if docker volume inspect "${RESOURCE_PREFIX}-media-storage" >/dev/null 2>&1; then
    log_ok "Media volume already exists: ${RESOURCE_PREFIX}-media-storage"
  else
    docker volume create "${RESOURCE_PREFIX}-media-storage" >/dev/null
    log_ok "Media volume created: ${RESOURCE_PREFIX}-media-storage"
  fi
}

wait_for_healthy() {
  local service="$1" timeout="${2:-90}" waited=0 cid status
  cid="$(dc ps -q "${service}")"
  [[ -n "${cid}" ]] || { log_err "${service} container not found."; return 1; }

  log_info "Waiting for ${service} to become healthy (timeout ${timeout}s)..."
  while [[ "${waited}" -lt "${timeout}" ]]; do
    status="$(docker inspect --format '{{.State.Health.Status}}' "${cid}" 2>/dev/null || echo "unknown")"
    [[ "${status}" == "healthy" ]] && { log_ok "${service} is healthy."; return 0; }
    sleep 3
    waited=$((waited + 3))
  done
  log_err "${service} did not become healthy within ${timeout}s (last status: ${status})."
  return 1
}

print_summary() {
  local frontend_url backend_url
  if [[ "${DEPLOY_ENV}" == "development" ]]; then
    frontend_url="http://localhost:${FRONTEND_PORT:-3000}"
    backend_url="http://localhost:${BACKEND_PORT:-4000}/v1"
  else
    # demo/production publish frontend on a fixed host port 80 (see
    # compose.demo.yml/compose.prod.yml) so the existing external Nginx
    # Proxy Manager never needs reconfiguring on a redeploy. Backend stays
    # internal-only — NPM reaches it through the frontend's own
    # `/v1/:path*` rewrite, not a published host port.
    frontend_url="http://localhost:80"
    backend_url="backend:4000/v1 on creator-network (internal only — reached via the frontend's /v1 rewrite, not a published port)"
  fi

  log_step "Leinaflow install complete (env: ${DEPLOY_ENV})"
  echo "  Frontend:      ${frontend_url}"
  echo "  Backend API:   ${backend_url}"
  echo "  Backups dir:   ${BACKUP_DIR}"
  echo "  Compose files: $(compose_files)"
  echo "  Env file:      $(env_file_for)"
  echo "  Server id:     ${DEPLOYMENT_DIR}/server.json"
  echo
  dc ps
  echo
  echo "Next steps:"
  echo "  - deployment/healthcheck.sh --env ${DEPLOY_ENV}   # re-check health any time"
  echo "  - deployment/backup.sh --env ${DEPLOY_ENV}        # take a backup"
  echo "  - deployment/status.sh --env ${DEPLOY_ENV}        # snapshot commit/health/version"
  echo "  - docs/Deployment.md                              # full reference"
}

# ── Main flow ────────────────────────────────────────────────────────────

log_step "Leinaflow install (env: ${DEPLOY_ENV})"

detect_os
log_ok "Detected OS: ${OS_ID} ${OS_VERSION} (family: ${OS_FAMILY})"

# A minimal server image may not even have curl yet — bootstrap it before
# using it for the connectivity check or the Docker repo setup below.
if ! command -v curl >/dev/null 2>&1; then
  log_info "curl not found — installing it..."
  case "${OS_FAMILY}" in
    debian) sudo_run apt-get update -y && sudo_run apt-get install -y curl ;;
    rhel)
      pkgmgr=dnf; command -v dnf >/dev/null 2>&1 || pkgmgr=yum
      sudo_run "${pkgmgr}" install -y curl
      ;;
  esac
  require_cmd curl
fi

log_step "1b. Checking internet connectivity"
if has_internet; then
  log_ok "Internet connectivity confirmed."
else
  log_err "No internet connectivity — required to pull images and install packages."
  exit 1
fi

log_step "2. Checking Docker"
ensure_docker_installed

log_step "3. Checking Docker Compose"
ensure_compose_available

log_step "1. Validating required ports"
check_ports || { log_err "Resolve the port conflict(s) above before continuing."; exit 1; }

create_folders

log_step "7. Preparing environment files"
ensure_env_files "${PROJECT_ROOT}" || exit 1

load_env

log_step "8. Running environment validation"
"${DEPLOYMENT_DIR}/env-check.sh" --env "${DEPLOY_ENV}" ${ASSUME_YES:+-y}

log_step "9. Building containers"
dc build

log_step "10. Starting PostgreSQL and Redis"
dc up -d postgres redis
wait_for_healthy postgres
wait_for_healthy redis

log_step "11. Generating Prisma client"
dc exec -T backend npm run prisma:generate

log_step "12. Running database migrations"
dc exec -T backend npm run prisma:migrate:deploy

if should_seed; then
  log_step "13. Seeding database"
  dc exec -T backend npm run prisma:seed
else
  log_step "13. Seeding database — skipped (${SEED_MODE} mode, env=${DEPLOY_ENV}; pass --seed to force)"
fi

log_step "14. Starting all services (builds frontend if required)"
dc up -d

log_info "Waiting for backend/frontend to finish booting..."
wait_for_http_ok backend "http://localhost:4000/v1/health" 90 || log_warn "Backend did not respond within 90s — see the health check below."
wait_for_http_ok frontend "http://localhost:3000" 90 || log_warn "Frontend did not respond within 90s — see the health check below."

log_step "15. Verifying installation"
"${DEPLOYMENT_DIR}/healthcheck.sh" --env "${DEPLOY_ENV}"

log_step "16. Recording server identity"
ensure_server_identity
log_ok "Wrote ${DEPLOYMENT_DIR}/server.json (see docs/COC-Integration.md#server-discovery)"

print_summary
