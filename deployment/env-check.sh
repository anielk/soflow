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

# ── Disk / Memory / CPU ────────────────────────────────────────────────────
check_resources || FAILED=1

# ── Environment variables ─────────────────────────────────────────────────
load_env

# Required by backend/src/config/env.validation.ts (Joi .required()) plus
# the root-level vars compose.yml interpolates — kept in sync with
# those two sources, not duplicated logic.
REQUIRED_VARS=(JWT_SECRET DATABASE_URL REDIS_URL POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD)
RECOMMENDED_VARS=(MEDIA_STORAGE_DRIVER MEDIA_STORAGE_PATH MEDIA_MAX_FILE_SIZE_MB NEXT_PUBLIC_API_URL)

ENV_FILE="$(env_file_for)"
if [[ ! -f "${ENV_FILE}" ]]; then
  fail "No $(basename "${ENV_FILE}") found at ${ENV_FILE} — run deployment/install.sh or copy $(basename "${ENV_FILE}").example."
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
