#!/usr/bin/env bash
# healthcheck.sh — verify the running stack is actually healthy.
#
# This is the single source of truth for "is Leinaflow up" — install.sh and
# update.sh both call this instead of re-implementing their own checks.
#
# Usage: healthcheck.sh [--env development|demo|production]
# Exit code: 0 if every check PASSes, 1 if any check FAILs.

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

parse_common_flags "$@"
validate_deploy_env
load_env
detect_compose_cmd

FAILED=0
pass() { printf '%s[PASS]%s %s\n' "${COLOR_GREEN}" "${COLOR_RESET}" "$*"; }
fail() { printf '%s[FAIL]%s %s\n' "${COLOR_RED}" "${COLOR_RESET}" "$*" >&2; FAILED=1; }

log_step "Leinaflow health check (env: ${DEPLOY_ENV})"

# ── Docker daemon ────────────────────────────────────────────────────────
if docker info >/dev/null 2>&1; then
  pass "Docker daemon is running"
else
  fail "Docker daemon is not reachable"
  log_step "Summary"
  fail "Cannot continue without Docker — aborting remaining checks."
  exit 1
fi

# ── Expected containers ──────────────────────────────────────────────────
EXPECTED_SERVICES=(frontend backend postgres redis)

for svc in "${EXPECTED_SERVICES[@]}"; do
  if service_running "${svc}"; then
    pass "Container running: ${svc}"
  else
    fail "Container not running: ${svc}"
  fi
done

# ── PostgreSQL ───────────────────────────────────────────────────────────
if service_running postgres; then
  if dc exec -T postgres pg_isready -U "${POSTGRES_USER:-creator_admin}" -d "${POSTGRES_DB:-creator_platform}" >/dev/null 2>&1; then
    pass "PostgreSQL is accepting connections"
  else
    fail "PostgreSQL is not accepting connections"
  fi
else
  fail "PostgreSQL check skipped — container not running"
fi

# ── Redis ────────────────────────────────────────────────────────────────
if service_running redis; then
  if [[ "$(dc exec -T redis redis-cli ping 2>/dev/null | tr -d '\r')" == "PONG" ]]; then
    pass "Redis responded to PING"
  else
    fail "Redis did not respond to PING"
  fi
else
  fail "Redis check skipped — container not running"
fi

# ── Backend ──────────────────────────────────────────────────────────────
# Checked from inside the container (via Node's http module — neither image
# ships curl/wget) so it works regardless of whether the port is published
# to the host (dev publishes it, prod does not).
if service_running backend; then
  if http_check_in_container backend "http://localhost:4000/v1/health"; then
    pass "Backend /v1/health responded"
  else
    fail "Backend /v1/health did not respond"
  fi
else
  fail "Backend check skipped — container not running"
fi

# ── Frontend ─────────────────────────────────────────────────────────────
if service_running frontend; then
  if http_check_in_container frontend "http://localhost:3000"; then
    pass "Frontend responded on port 3000"
  else
    fail "Frontend did not respond on port 3000"
  fi
else
  fail "Frontend check skipped — container not running"
fi

# ── Disk space ───────────────────────────────────────────────────────────
AVAILABLE_KB="$(df -Pk "${PROJECT_ROOT}" | awk 'NR==2 {print $4}')"
AVAILABLE_GB=$((AVAILABLE_KB / 1024 / 1024))
if [[ "${AVAILABLE_GB}" -ge "${MIN_DISK_GB}" ]]; then
  pass "Disk space: ${AVAILABLE_GB}GB available"
else
  fail "Disk space low: ${AVAILABLE_GB}GB available (minimum ${MIN_DISK_GB}GB)"
fi

# ── Media storage ────────────────────────────────────────────────────────
MEDIA_PATH="${MEDIA_STORAGE_PATH:-/data/media}"
if service_running backend; then
  if dc exec -T backend sh -c "test -d '${MEDIA_PATH}' && test -w '${MEDIA_PATH}'" >/dev/null 2>&1; then
    pass "Media storage writable: ${MEDIA_PATH}"
  else
    fail "Media storage missing or not writable: ${MEDIA_PATH}"
  fi
else
  fail "Media storage check skipped — backend container not running"
fi

log_step "Summary"
if [[ "${FAILED}" -eq 0 ]]; then
  log_ok "PASS — Leinaflow (${DEPLOY_ENV}) is healthy."
  exit 0
else
  log_err "FAIL — one or more health checks failed. See above."
  exit 1
fi
