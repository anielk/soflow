#!/usr/bin/env bash
# env-check.sh — verify the host is fit to run Leinaflow.
#
# Standalone (run it directly to audit a box) and also called by install.sh
# as one step of the install flow — one implementation, two callers.
#
# Usage: env-check.sh [--env development|demo|production] [-y|--yes]
# Exit code: 0 if every check passes, 1 if any check fails (warnings don't fail it).

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

parse_common_flags "$@"
validate_deploy_env

FAILED=0
fail()  { log_err "$*"; FAILED=1; }

log_step "Leinaflow environment check (env: ${DEPLOY_ENV})"

# ── Docker / Compose ────────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
  log_ok "Docker present: $(docker --version)"
else
  fail "Docker is not installed. Run deployment/install.sh to install it."
fi

if detect_compose_cmd 2>/dev/null; then
  log_ok "Compose present: $(${COMPOSE} version --short 2>/dev/null || ${COMPOSE} version)"
else
  fail "Docker Compose (plugin or standalone) is not available."
fi

# ── Permissions ──────────────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
  if docker ps >/dev/null 2>&1; then
    log_ok "Current user ($(whoami)) can run docker commands."
  else
    fail "Current user ($(whoami)) cannot run 'docker ps' — add them to the docker group or run as root."
  fi
fi

if [[ -w "${PROJECT_ROOT}" ]]; then
  log_ok "Project root is writable: ${PROJECT_ROOT}"
else
  fail "Project root is not writable: ${PROJECT_ROOT}"
fi

# ── Disk space ───────────────────────────────────────────────────────────
AVAILABLE_KB="$(df -Pk "${PROJECT_ROOT}" | awk 'NR==2 {print $4}')"
AVAILABLE_GB=$((AVAILABLE_KB / 1024 / 1024))
if [[ "${AVAILABLE_GB}" -ge "${MIN_DISK_GB}" ]]; then
  log_ok "Disk space: ${AVAILABLE_GB}GB available (minimum ${MIN_DISK_GB}GB)"
else
  fail "Disk space: only ${AVAILABLE_GB}GB available, minimum ${MIN_DISK_GB}GB required (override with MIN_DISK_GB)"
fi

# ── Memory ───────────────────────────────────────────────────────────────
if [[ -r /proc/meminfo ]]; then
  TOTAL_MEM_MB=$(($(awk '/MemTotal/ {print $2}' /proc/meminfo) / 1024))
  if [[ "${TOTAL_MEM_MB}" -ge "${MIN_MEM_MB}" ]]; then
    log_ok "Memory: ${TOTAL_MEM_MB}MB total (minimum ${MIN_MEM_MB}MB)"
  else
    log_warn "Memory: only ${TOTAL_MEM_MB}MB total, ${MIN_MEM_MB}MB recommended (override with MIN_MEM_MB)"
  fi
else
  log_warn "Could not read /proc/meminfo — skipping memory check."
fi

# ── CPU ──────────────────────────────────────────────────────────────────
CPU_CORES="$(nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo 1)"
if [[ "${CPU_CORES}" -ge "${MIN_CPU_CORES}" ]]; then
  log_ok "CPU: ${CPU_CORES} core(s) (minimum ${MIN_CPU_CORES})"
else
  log_warn "CPU: only ${CPU_CORES} core(s), ${MIN_CPU_CORES} recommended (override with MIN_CPU_CORES)"
fi

# ── Environment variables ─────────────────────────────────────────────────
load_env

# Required by backend/src/config/env.validation.ts (Joi .required()) plus
# the root-level vars docker-compose.yml interpolates — kept in sync with
# those two sources, not duplicated logic.
REQUIRED_VARS=(JWT_SECRET DATABASE_URL REDIS_URL POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD)
RECOMMENDED_VARS=(MEDIA_STORAGE_DRIVER MEDIA_STORAGE_PATH MEDIA_MAX_FILE_SIZE_MB NEXT_PUBLIC_API_URL)

if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
  fail "No .env found at ${PROJECT_ROOT}/.env — run deployment/install.sh or copy .env.production.example."
else
  for var in "${REQUIRED_VARS[@]}"; do
    if [[ -n "${!var:-}" ]]; then
      log_ok "Env var set: ${var}"
    else
      fail "Missing required env var: ${var}"
    fi
  done
  for var in "${RECOMMENDED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      log_warn "Missing recommended env var: ${var} (a default will be used)"
    fi
  done
fi

# ── Media path ───────────────────────────────────────────────────────────
MEDIA_PATH="${MEDIA_STORAGE_PATH:-/data/media}"
if detect_compose_cmd 2>/dev/null && service_running backend; then
  if dc exec -T backend sh -c "test -d '${MEDIA_PATH}' && test -w '${MEDIA_PATH}'" >/dev/null 2>&1; then
    log_ok "Media path writable inside backend container: ${MEDIA_PATH}"
  else
    fail "Media path is missing or not writable inside the backend container: ${MEDIA_PATH}"
  fi
else
  log_warn "Backend container not running — skipping in-container media path check (will be verified on install/healthcheck)."
fi

log_step "Summary"
if [[ "${FAILED}" -eq 0 ]]; then
  log_ok "All checks passed."
  exit 0
else
  log_err "One or more checks failed — see above."
  exit 1
fi
