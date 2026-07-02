#!/usr/bin/env bash
# Shared helpers for deployment/*.sh.
#
# This file is a library — it must be sourced, never executed directly:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"
#
# It centralizes everything every deployment script needs so behavior (env
# resolution, compose invocation, logging, non-interactive/CPOS support)
# stays identical across install/update/backup/restore/healthcheck/uninstall.

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "common.sh is a library — source it from another script, don't run it directly." >&2
  exit 1
fi

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "${LIB_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DEPLOYMENT_DIR}/.." && pwd)"
export LIB_DIR DEPLOYMENT_DIR PROJECT_ROOT

# ── Output ───────────────────────────────────────────────────────────────

if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
  COLOR_RED=$'\033[0;31m'; COLOR_GREEN=$'\033[0;32m'; COLOR_YELLOW=$'\033[0;33m'
  COLOR_BLUE=$'\033[0;34m'; COLOR_BOLD=$'\033[1m'; COLOR_RESET=$'\033[0m'
else
  COLOR_RED=''; COLOR_GREEN=''; COLOR_YELLOW=''; COLOR_BLUE=''; COLOR_BOLD=''; COLOR_RESET=''
fi

log_info() { printf '%s[INFO]%s %s\n' "${COLOR_BLUE}" "${COLOR_RESET}" "$*"; }
log_ok()   { printf '%s[ OK ]%s %s\n' "${COLOR_GREEN}" "${COLOR_RESET}" "$*"; }
log_warn() { printf '%s[WARN]%s %s\n' "${COLOR_YELLOW}" "${COLOR_RESET}" "$*" >&2; }
log_err()  { printf '%s[FAIL]%s %s\n' "${COLOR_RED}" "${COLOR_RESET}" "$*" >&2; }
log_step() { printf '\n%s%s%s\n' "${COLOR_BOLD}" "$*" "${COLOR_RESET}"; }

# ── Non-interactive / CPOS support ──────────────────────────────────────
#
# Every script exposes -y/--yes (sets ASSUME_YES=1) so it can run
# unattended. confirm()/confirm_typed() are the only prompting primitives —
# route all interactive checks through them so "run non-interactively" stays
# a single, consistent contract for CPOS to rely on.

ASSUME_YES="${ASSUME_YES:-0}"

confirm() {
  local prompt="$1" reply
  [[ "${ASSUME_YES}" == "1" ]] && return 0
  if [[ ! -t 0 ]]; then
    log_err "Refusing to prompt in a non-interactive shell: ${prompt} (pass --yes to proceed non-interactively)"
    return 1
  fi
  read -r -p "${prompt} [y/N] " reply
  [[ "${reply}" =~ ^[Yy]$ ]]
}

# confirm_typed "Prompt" "expected-word" — stronger confirmation for
# destructive operations (restore, volume/backup deletion).
confirm_typed() {
  local prompt="$1" expected="$2" reply
  [[ "${ASSUME_YES}" == "1" ]] && return 0
  if [[ ! -t 0 ]]; then
    log_err "Refusing to prompt in a non-interactive shell: ${prompt} (pass --yes to proceed non-interactively)"
    return 1
  fi
  read -r -p "${prompt} (type '${expected}' to confirm) " reply
  [[ "${reply}" == "${expected}" ]]
}

# parse_common_flags "$@" — consumes the flags every script shares
# (-y/--yes, --env[=]) and leaves the rest in REMAINING_ARGS for the
# caller's own argument parsing.
parse_common_flags() {
  REMAINING_ARGS=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -y|--yes) ASSUME_YES=1; shift ;;
      --env) DEPLOY_ENV="$2"; shift 2 ;;
      --env=*) DEPLOY_ENV="${1#--env=}"; shift ;;
      *) REMAINING_ARGS+=("$1"); shift ;;
    esac
  done
  export ASSUME_YES DEPLOY_ENV
}

# ── Deployment environment ───────────────────────────────────────────────
#
# development -> docker-compose.yml only (hot-reload, published dev ports)
# demo / production -> docker-compose.yml + docker-compose.prod.yml (built
#   images, nginx, no published app ports). Nothing here is hardcoded to a
#   specific host/port — those come from .env.

DEPLOY_ENV="${DEPLOY_ENV:-production}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
MIN_DISK_GB="${MIN_DISK_GB:-5}"
MIN_MEM_MB="${MIN_MEM_MB:-2048}"
MIN_CPU_CORES="${MIN_CPU_CORES:-2}"

validate_deploy_env() {
  case "${DEPLOY_ENV}" in
    development|demo|production) ;;
    *)
      log_err "Invalid DEPLOY_ENV '${DEPLOY_ENV}' — must be one of: development, demo, production"
      exit 1
      ;;
  esac
}

# Compose interpolation (${POSTGRES_DB} etc. in the yaml) reads root .env;
# the backend/frontend containers' actual runtime env comes from .env.production
# via `env_file:` in docker-compose.yml (see docker-compose.yml's backend
# service — this is an existing project convention, not something these
# scripts introduce). Source both so validation reflects what the
# containers really get, .env.production taking precedence since that's
# what's actually injected into them.
load_env() {
  if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${PROJECT_ROOT}/.env"
    set +o allexport
  fi
  if [[ -f "${PROJECT_ROOT}/.env.production" ]]; then
    set -o allexport
    # shellcheck disable=SC1091
    source "${PROJECT_ROOT}/.env.production"
    set +o allexport
  fi
}

# compose_files — echoes the -f flags for the resolved DEPLOY_ENV.
compose_files() {
  case "${DEPLOY_ENV}" in
    development) echo "-f ${PROJECT_ROOT}/docker-compose.yml" ;;
    demo|production) echo "-f ${PROJECT_ROOT}/docker-compose.yml -f ${PROJECT_ROOT}/docker-compose.prod.yml" ;;
  esac
}

# ── Docker / Compose ──────────────────────────────────────────────────────

detect_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
  else
    log_err "Neither 'docker compose' (plugin) nor 'docker-compose' (standalone) is available."
    return 1
  fi
  export COMPOSE
}

# dc <compose-subcommand-and-args...> — runs compose from the project root
# with the -f flags for the resolved DEPLOY_ENV already applied.
dc() {
  # Intentional word-splitting: COMPOSE ("docker compose") and compose_files
  # (multiple "-f <file>" pairs) are both meant to expand into several words.
  # shellcheck disable=SC2086,SC2046
  (cd "${PROJECT_ROOT}" && ${COMPOSE} $(compose_files) "$@")
}

# service_running <name> — true if the given compose service has a running container.
service_running() {
  dc ps --status running --services 2>/dev/null | grep -qx "$1"
}

# http_check_in_container <service> <url> — HTTP GET <url> from inside
# <service>'s container, true on a 2xx/3xx response. Both the backend and
# frontend images are Node-based but don't ship curl/wget, so this uses
# Node's built-in http module instead of assuming an HTTP client exists.
http_check_in_container() {
  local service="$1" url="$2"
  dc exec -T "${service}" node -e "
    require('http').get(process.argv[1], (res) => {
      process.exit(res.statusCode >= 200 && res.statusCode < 400 ? 0 : 1);
    }).on('error', () => process.exit(1));
  " "${url}" >/dev/null 2>&1
}

# wait_for_http_ok <service> <url> [timeout] — poll http_check_in_container
# until it succeeds or the timeout elapses. Neither the backend nor frontend
# service has a Docker-level HEALTHCHECK (unlike postgres/redis), so
# `docker compose up -d` returns as soon as the process starts, not once the
# app inside is actually ready — callers that immediately curl/healthcheck
# right after a restart need this instead of a Docker-health poll.
wait_for_http_ok() {
  local service="$1" url="$2" timeout="${3:-60}" waited=0
  while [[ "${waited}" -lt "${timeout}" ]]; do
    http_check_in_container "${service}" "${url}" && return 0
    sleep 2
    waited=$((waited + 2))
  done
  return 1
}

# ── OS detection ──────────────────────────────────────────────────────────

detect_os() {
  if [[ ! -f /etc/os-release ]]; then
    log_err "/etc/os-release not found — cannot detect Linux distribution."
    return 1
  fi
  # shellcheck disable=SC1091
  source /etc/os-release
  OS_ID="${ID:-unknown}"
  OS_VERSION="${VERSION_ID:-unknown}"
  OS_ID_LIKE="${ID_LIKE:-}"

  case "${OS_ID} ${OS_ID_LIKE}" in
    *debian*|*ubuntu*) OS_FAMILY="debian" ;;
    *rhel*|*fedora*|*centos*|*rocky*|*almalinux*|*amzn*) OS_FAMILY="rhel" ;;
    *)
      log_err "Unsupported Linux distribution: ${OS_ID} ${OS_VERSION} (supported: Debian/Ubuntu, RHEL/CentOS/Fedora/Rocky Linux/AlmaLinux)"
      return 1
      ;;
  esac
  export OS_ID OS_VERSION OS_ID_LIKE OS_FAMILY
}

# ── Misc ───────────────────────────────────────────────────────────────────

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_err "Required command not found: $1"
    return 1
  fi
}

# has_internet — best-effort connectivity check, doesn't hard-fail the caller.
has_internet() {
  curl -fsS --max-time 5 https://get.docker.com -o /dev/null 2>/dev/null \
    || curl -fsS --max-time 5 https://registry-1.docker.io/v2/ -o /dev/null 2>/dev/null
}
