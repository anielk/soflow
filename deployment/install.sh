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
#   --env <env>   Target environment (default: production). development uses
#                 docker-compose.yml only; demo/production add the prod overlay.
#   -y, --yes     Non-interactive: accept all prompts (for CPOS/scripted runs).
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

sudo_run() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    require_cmd sudo
    sudo "$@"
  fi
}

should_seed() {
  case "${SEED_MODE}" in
    force) return 0 ;;
    skip) return 1 ;;
    auto) [[ "${DEPLOY_ENV}" != "production" ]] ;;
  esac
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -Htln "( sport = :${port} )" 2>/dev/null | grep -q . && return 0
    ss -Htun "( sport = :${port} )" 2>/dev/null | grep -q . && return 0
    return 1
  fi
  (exec 3<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null && { exec 3<&- 3>&- 2>/dev/null; return 0; } || return 1
}

check_ports() {
  log_step "1. Validating required ports"
  local already_installed=0
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q '^creator-'; then
    already_installed=1
  fi

  local ports=()
  if [[ "${DEPLOY_ENV}" == "development" ]]; then
    ports=("${FRONTEND_PORT:-3000}" "${BACKEND_PORT:-4000}" "${POSTGRES_PORT:-5432}" "${REDIS_PORT:-6379}")
  else
    ports=(80 443)
  fi

  local conflict=0
  for port in "${ports[@]}"; do
    if port_in_use "${port}"; then
      if [[ "${already_installed}" -eq 1 ]]; then
        log_info "Port ${port} is in use (expected — Leinaflow containers already exist here)."
      else
        log_err "Port ${port} is already in use by another process."
        conflict=1
      fi
    else
      log_ok "Port ${port} is free."
    fi
  done
  [[ "${conflict}" -eq 0 ]] || { log_err "Resolve the port conflict(s) above before continuing."; exit 1; }
}

ensure_docker_installed() {
  log_step "2. Checking Docker"
  if command -v docker >/dev/null 2>&1; then
    log_ok "Docker already installed: $(docker --version)"
    return 0
  fi

  log_info "Docker not found — installing for ${OS_FAMILY} (${OS_ID} ${OS_VERSION})..."
  require_cmd curl

  case "${OS_FAMILY}" in
    debian)
      local codename="${VERSION_CODENAME:-}"
      [[ -n "${codename}" ]] || { log_err "Could not determine distro codename from /etc/os-release."; exit 1; }
      local arch; arch="$(dpkg --print-architecture)"
      sudo_run apt-get update -y
      sudo_run apt-get install -y ca-certificates curl gnupg
      sudo_run install -m 0755 -d /etc/apt/keyrings
      curl -fsSL "https://download.docker.com/linux/${OS_ID}/gpg" | sudo_run tee /etc/apt/keyrings/docker.asc >/dev/null
      sudo_run chmod a+r /etc/apt/keyrings/docker.asc
      echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${OS_ID} ${codename} stable" \
        | sudo_run tee /etc/apt/sources.list.d/docker.list >/dev/null
      sudo_run apt-get update -y
      sudo_run apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
    rhel)
      local pkgmgr; command -v dnf >/dev/null 2>&1 && pkgmgr=dnf || pkgmgr=yum
      sudo_run "${pkgmgr}" install -y yum-utils
      sudo_run "${pkgmgr}" config-manager --add-repo "https://download.docker.com/linux/centos/docker-ce.repo"
      sudo_run "${pkgmgr}" install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      sudo_run systemctl enable --now docker
      ;;
  esac

  require_cmd docker
  log_ok "Docker installed: $(docker --version)"
}

ensure_compose_available() {
  log_step "3. Checking Docker Compose"
  if detect_compose_cmd 2>/dev/null; then
    log_ok "Docker Compose available: ${COMPOSE}"
    return 0
  fi

  log_info "Docker Compose plugin not found — installing..."
  case "${OS_FAMILY}" in
    debian) sudo_run apt-get update -y; sudo_run apt-get install -y docker-compose-plugin ;;
    rhel)
      local pkgmgr; command -v dnf >/dev/null 2>&1 && pkgmgr=dnf || pkgmgr=yum
      sudo_run "${pkgmgr}" install -y docker-compose-plugin
      ;;
  esac
  detect_compose_cmd || { log_err "Docker Compose still unavailable after install."; exit 1; }
}

create_folders() {
  log_step "6. Creating required folders"
  mkdir -p "${BACKUP_DIR}"
  log_ok "Backup directory ready: ${BACKUP_DIR}"

  if docker volume inspect creator-media-storage >/dev/null 2>&1; then
    log_ok "Media volume already exists: creator-media-storage"
  else
    docker volume create creator-media-storage >/dev/null
    log_ok "Media volume created: creator-media-storage"
  fi
}

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

# fill_blank_secret <file> <VAR> — if VAR is present but empty, fill it with
# a freshly generated secret. Never touches a var that already has a value.
fill_blank_secret() {
  local file="$1" var="$2"
  if grep -qE "^${var}=$" "${file}"; then
    local secret; secret="$(generate_secret)"
    sed -i "s|^${var}=\$|${var}=${secret}|" "${file}"
    log_ok "Generated ${var} in $(basename "${file}")"
  fi
}

# Both .env (compose variable interpolation) and .env.production (what the
# backend/frontend containers actually load via `env_file:` in
# docker-compose.yml) are created from the same template — see
# docs/Deployment.md's environment variables section for why there are two.
ensure_env_files() {
  log_step "7. Preparing environment files"
  local template="${PROJECT_ROOT}/.env.production.example"
  [[ -f "${template}" ]] || { log_err "Template not found: ${template}"; exit 1; }

  local created_any=0
  for target in .env .env.production; do
    local path="${PROJECT_ROOT}/${target}"
    if [[ -f "${path}" ]]; then
      log_ok "${target} already exists — leaving it untouched."
    else
      cp "${template}" "${path}"
      fill_blank_secret "${path}" JWT_SECRET
      fill_blank_secret "${path}" SESSION_SECRET
      log_warn "${target} created from template at ${path} — review POSTGRES_PASSWORD before using this in production."
      created_any=1
    fi
  done

  if [[ "${created_any}" -eq 1 ]]; then
    confirm "Continue with the generated environment files as-is?" || {
      log_info "Edit .env / .env.production in ${PROJECT_ROOT} then re-run: deployment/install.sh --env ${DEPLOY_ENV}"
      exit 1
    }
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
    frontend_url="http://localhost/ (or your configured domain)"
    backend_url="http://localhost/api/ (proxied by nginx)"
  fi

  log_step "Leinaflow install complete (env: ${DEPLOY_ENV})"
  echo "  Frontend:      ${frontend_url}"
  echo "  Backend API:   ${backend_url}"
  echo "  Backups dir:   ${BACKUP_DIR}"
  echo "  Compose files: $(compose_files)"
  echo
  dc ps
  echo
  echo "Next steps:"
  echo "  - deployment/healthcheck.sh --env ${DEPLOY_ENV}   # re-check health any time"
  echo "  - deployment/backup.sh --env ${DEPLOY_ENV}        # take a backup"
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

ensure_docker_installed
ensure_compose_available
check_ports
create_folders
ensure_env_files
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

print_summary
