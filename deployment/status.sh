#!/usr/bin/env bash
# status.sh — read-only snapshot of the running deployment: current git
# commit, container state/health for every service, the most recent
# deploy.sh history entry for this environment, app version, and real
# health signals (not just "container is running" — see the Health section
# below) for the future Cloudivo Operations Center (COC) to poll.
#
# This is reporting, not a gate — it always exits 0 once it can talk to
# Docker, regardless of what it finds unhealthy. Use healthcheck.sh for a
# PASS/FAIL gate (e.g. in a cron job or CI step); use status.sh for a human
# glance or for COC to poll (`--json` gives it a stable machine-readable
# shape — schema_version/script/deployment_engine/version/result/exit_code/
# timestamp alongside the existing env/git/services/last_deploy fields —
# see docs/COC-Integration.md. Existing fields never change shape; only new
# ones are added, so this stays backwards compatible for any caller keyed
# on the old shape).
#
# Usage:
#   deployment/status.sh [--env development|demo|production]
#   deployment/status.sh --env production --json
#
# Exit codes: 0 status gathered successfully (see the report for health),
# 1 Docker/Compose itself isn't reachable.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

JSON_OUTPUT=0

parse_common_flags "$@"
set -- "${REMAINING_ARGS[@]}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON_OUTPUT=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

# fail <message> — the shared shape for both of this script's error exits
# (compose missing, Docker unreachable): human message on stderr always;
# when --json was given, also a minimal JSON error object on stdout so a
# --json caller never has to branch on "did this even return JSON".
fail() {
  local message="$1"
  log_err "${message}"
  if [[ "${JSON_OUTPUT}" -eq 1 ]]; then
    printf '{"schema_version":"%s","script":"status.sh","deployment_engine":"%s","environment":"%s","result":"error","exit_code":1,"timestamp":"%s","message":"%s"}\n' \
      "${SCHEMA_VERSION}" "${DEPLOYMENT_ENGINE_VERSION}" "$(json_escape "${DEPLOY_ENV}")" "$(date -Iseconds)" "$(json_escape "${message}")"
  fi
  exit 1
}

validate_deploy_env
load_env

if ! detect_compose_cmd 2>/dev/null; then
  fail "Neither 'docker compose' (plugin) nor 'docker-compose' (standalone) is available."
fi

if ! docker info >/dev/null 2>&1; then
  fail "Docker daemon is not reachable."
fi

# ── Git state ──────────────────────────────────────────────────────────────

GIT_COMMIT="unknown"; GIT_SHORT="unknown"; GIT_BRANCH="unknown"; GIT_SUBJECT=""; GIT_DIRTY="false"
if git -C "${PROJECT_ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_COMMIT="$(git -C "${PROJECT_ROOT}" rev-parse HEAD)"
  GIT_SHORT="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD)"
  GIT_BRANCH="$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD)"
  GIT_SUBJECT="$(git -C "${PROJECT_ROOT}" log -1 --format=%s)"
  [[ -n "$(git -C "${PROJECT_ROOT}" status --porcelain)" ]] && GIT_DIRTY="true"
fi

# ── Per-service container state/health ──────────────────────────────────────

SERVICES=(postgres redis backend frontend)

SERVICE_STATE=(); SERVICE_HEALTH=()
declare -A SVC_HEALTH_MAP
for svc in "${SERVICES[@]}"; do
  cid="$(dc ps -q "${svc}" 2>/dev/null || true)"
  if [[ -z "${cid}" ]]; then
    SERVICE_STATE+=("not created")
    SERVICE_HEALTH+=("n/a")
    SVC_HEALTH_MAP["${svc}"]="n/a"
    continue
  fi
  svc_health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}(no healthcheck){{end}}' "${cid}" 2>/dev/null || echo unknown)"
  SERVICE_STATE+=("$(docker inspect --format '{{.State.Status}}' "${cid}" 2>/dev/null || echo unknown)")
  SERVICE_HEALTH+=("${svc_health}")
  SVC_HEALTH_MAP["${svc}"]="${svc_health}"
done

# ── Version and deep health (requirement: version, git commit, deployment
# time, uptime, backend/frontend healthy, database reachable, storage
# healthy — see docs/COC-Integration.md#monitoring-flow) ───────────────────
#
# Docker's own health status for backend (SVC_HEALTH_MAP[backend], above)
# is liveness-only by design (see compose.yml's backend healthcheck
# comment) — it says nothing about the database or storage specifically.
# For those two, fetch the backend's real /v1/health report instead (same
# HealthReport contract backend/src/health/health.service.ts computes) —
# from inside its own container, so this works identically in every
# environment regardless of how (or whether) a reverse proxy in front of it
# is set up. Only attempted if the container is
# actually running, with a short timeout, and never fails this script if
# it can't be reached — an unreachable backend just means these read as
# false/unknown, same as everything else status.sh reports.
APP_VERSION="$(read_app_version)"
BACKEND_OVERALL_STATUS="unknown"
UPTIME_SECONDS="null"
DATABASE_REACHABLE="false"
STORAGE_HEALTHY="false"
if service_running backend; then
  declare -A CHECK_STATUS
  HEALTH_REPORT="$(fetch_backend_health_report 5)"
  if [[ -n "${HEALTH_REPORT}" ]]; then
    {
      read -r BACKEND_OVERALL_STATUS
      read -r uptime_line
      [[ "${uptime_line}" =~ ^[0-9]+$ ]] && UPTIME_SECONDS="${uptime_line}"
      while IFS=$'\t' read -r cname cstatus; do
        [[ -n "${cname}" ]] && CHECK_STATUS["${cname}"]="${cstatus}"
      done
    } <<< "${HEALTH_REPORT}"
    [[ "${CHECK_STATUS[database]:-}" == "ok" ]] && DATABASE_REACHABLE="true"
    [[ "${CHECK_STATUS[storage]:-}" == "ok" ]] && STORAGE_HEALTHY="true"
  fi
fi
BACKEND_HEALTHY="false"; [[ "${SVC_HEALTH_MAP[backend]:-}" == "healthy" ]] && BACKEND_HEALTHY="true"
FRONTEND_HEALTHY="false"; [[ "${SVC_HEALTH_MAP[frontend]:-}" == "healthy" ]] && FRONTEND_HEALTHY="true"

# ── Last recorded deploy for this env ───────────────────────────────────────
# deploy.sh appends one tab-separated line per attempt to this file; it's
# host-local state (gitignored via *.log), not tracked in git.

HISTORY_FILE="${DEPLOYMENT_DIR}/.deploy-history.log"
LAST_DEPLOY_LINE=""
if [[ -f "${HISTORY_FILE}" ]]; then
  LAST_DEPLOY_LINE="$(awk -F'\t' -v env="${DEPLOY_ENV}" '$2 == env {line = $0} END {print line}' "${HISTORY_FILE}")"
fi

# ── Output ───────────────────────────────────────────────────────────────

if [[ "${JSON_OUTPUT}" -eq 1 ]]; then
  services_json=""
  for i in "${!SERVICES[@]}"; do
    [[ -n "${services_json}" ]] && services_json+=","
    services_json+="$(printf '{"name":"%s","state":"%s","health":"%s"}' "${SERVICES[$i]}" "${SERVICE_STATE[$i]}" "${SERVICE_HEALTH[$i]}")"
  done

  last_deploy_json="null"
  deploy_time_json="null"
  if [[ -n "${LAST_DEPLOY_LINE}" ]]; then
    IFS=$'\t' read -r ld_ts _ ld_commit ld_duration ld_status ld_branch _ <<< "${LAST_DEPLOY_LINE}"
    last_deploy_json="$(printf '{"timestamp":"%s","commit":"%s","duration_seconds":%s,"status":"%s","branch":"%s"}' \
      "$(json_escape "${ld_ts}")" "$(json_escape "${ld_commit}")" "${ld_duration}" "$(json_escape "${ld_status}")" "$(json_escape "${ld_branch:-unknown}")")"
    deploy_time_json="\"$(json_escape "${ld_ts}")\""
  fi

  health_json="$(printf '{"version":"%s","commit":"%s","deployment_time":%s,"uptime_seconds":%s,"backend_healthy":%s,"frontend_healthy":%s,"database_reachable":%s,"storage_healthy":%s}' \
    "$(json_escape "${APP_VERSION}")" "$(json_escape "${GIT_COMMIT}")" "${deploy_time_json}" "${UPTIME_SECONDS}" \
    "${BACKEND_HEALTHY}" "${FRONTEND_HEALTHY}" "${DATABASE_REACHABLE}" "${STORAGE_HEALTHY}")"

  # env/git/services/last_deploy below are the original fields, unchanged in
  # shape — everything else (schema_version.../health) is new and additive,
  # per this script's backwards-compatibility guarantee (see header comment).
  printf '{"schema_version":"%s","script":"status.sh","deployment_engine":"%s","environment":"%s","version":"%s","result":"ok","exit_code":0,"timestamp":"%s","env":"%s","git":{"commit":"%s","short":"%s","branch":"%s","subject":"%s","dirty":%s},"services":[%s],"last_deploy":%s,"health":%s}\n' \
    "${SCHEMA_VERSION}" "${DEPLOYMENT_ENGINE_VERSION}" "$(json_escape "${DEPLOY_ENV}")" "$(json_escape "${APP_VERSION}")" "$(date -Iseconds)" \
    "${DEPLOY_ENV}" "${GIT_COMMIT}" "${GIT_SHORT}" "${GIT_BRANCH}" "${GIT_SUBJECT//\"/\\\"}" "${GIT_DIRTY}" "${services_json}" "${last_deploy_json}" "${health_json}"
  exit 0
fi

log_step "Leinaflow status — env: ${DEPLOY_ENV}"
echo "  Version: ${APP_VERSION}"
echo "  Git:     ${GIT_SHORT} on ${GIT_BRANCH}${GIT_SUBJECT:+ — ${GIT_SUBJECT}}"
[[ "${GIT_DIRTY}" == "true" ]] && log_warn "Working tree has uncommitted local changes."
echo
printf '  %-10s %-14s %s\n' "SERVICE" "STATE" "HEALTH"
for i in "${!SERVICES[@]}"; do
  printf '  %-10s %-14s %s\n' "${SERVICES[$i]}" "${SERVICE_STATE[$i]}" "${SERVICE_HEALTH[$i]}"
done
echo
echo "  Health (from backend's /v1/health — 'unknown' if backend isn't reachable):"
printf '    %-20s %s\n' "Backend app status:" "${BACKEND_OVERALL_STATUS}"
printf '    %-20s %s\n' "Backend uptime:" "$([[ "${UPTIME_SECONDS}" == "null" ]] && echo "unknown" || format_duration "${UPTIME_SECONDS}")"
printf '    %-20s %s\n' "Backend healthy:" "${BACKEND_HEALTHY}"
printf '    %-20s %s\n' "Frontend healthy:" "${FRONTEND_HEALTHY}"
printf '    %-20s %s\n' "Database reachable:" "${DATABASE_REACHABLE}"
printf '    %-20s %s\n' "Storage healthy:" "${STORAGE_HEALTHY}"
echo
if [[ -n "${LAST_DEPLOY_LINE}" ]]; then
  IFS=$'\t' read -r ld_ts _ ld_commit ld_duration ld_status ld_branch _ <<< "${LAST_DEPLOY_LINE}"
  echo "  Last deploy (${DEPLOY_ENV}): ${ld_ts} — ${ld_commit:0:12} — $(format_duration "${ld_duration}") — ${ld_status}"
else
  echo "  Last deploy (${DEPLOY_ENV}): none recorded yet (${HISTORY_FILE} doesn't exist or has no entry for this env)"
fi
echo "  Full history: deployment/history.sh --env ${DEPLOY_ENV}"
echo "  Compose files: $(compose_files)"
echo "  Env file:      $(env_file_for)"
