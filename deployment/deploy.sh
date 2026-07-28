#!/usr/bin/env bash
# deploy.sh — the Cloudivo Deployment Engine (v1).
#
# git fetch -> reset to origin/main -> build -> migrate -> start -> health ->
# smoke test, for demo and production. This is the official release
# mechanism for Leinaflow, and the template every future Cloudivo product is
# meant to adopt as-is (see docs/deployment/Architecture.md's "Multi-product
# naming" section — PROJECT_NAME/RESOURCE_PREFIX already generalize the
# compose layering this script drives; nothing below is Leinaflow-specific).
# It is also the intended entry point for the future Cloudivo Operations
# Center (COC): every prompt is gated behind -y/--yes, every failure mode has
# a documented exit code, and every line of output is timestamped so a
# caller (or a human reading a log later) can correlate a failure with when
# it happened.
#
# Usage:
#   deployment/deploy.sh --env demo|production [-y|--yes] [options]
#
# Options:
#   --skip-git         Deploy whatever is currently checked out — skip the
#                       fetch/reset step entirely. For a host that isn't a
#                       git checkout, or a one-off redeploy of the current
#                       commit without touching git state.
#   --force            Required to proceed when the checkout has uncommitted
#                       local changes. Without it, deploy.sh explains what it
#                       found and aborts untouched. With it, those changes
#                       are stashed (named, timestamped, recoverable) before
#                       the reset to origin/main.
#   --no-smoke-test    Skip the post-deploy HTTP smoke tests.
#   --health-timeout N Seconds to wait for containers to report healthy
#                       (default 180, also via HEALTH_TIMEOUT env var).
#   --json             Send all human progress output to stderr and print a
#                       single machine-readable JSON summary to stdout as
#                       the last line (schema_version/script/environment/
#                       version/commit/commit_short/branch/timestamp/
#                       duration_seconds/exit_code/result/stage/message —
#                       see docs/COC-Integration.md). Same exit codes either
#                       way. Purely additive: without --json, output is
#                       identical to before this flag existed.
#
# What it does, in order:
#   1. Validate the environment (deployment/env-check.sh)
#   2. Fetch origin, reset the checkout to origin/main
#   3. Build Docker images
#   4. Run `prisma migrate deploy` (forward-only)
#   5. Start containers
#   6. Wait for backend and frontend to report Docker-healthy
#   7. Smoke test: GET /v1/health (backend) and GET / (frontend), each
#      checked from inside its own container — topology-independent, since
#      Leinaflow doesn't assume whether a reverse proxy reaches it via the
#      Docker network or a published host port (that's an infrastructure
#      decision, not this repo's)
#   8. Print the deployed commit and total duration, append a line to
#      deployment/.deploy-history.log (rollback.sh reads this), regenerate
#      deployment/history.json from it, and refresh deployment/server.json
#
# Exit codes:
#   0  deployed and verified healthy
#   1  argument/environment validation failed — nothing was touched
#   2  git fetch/reset failed, or uncommitted changes were found and --force
#      was not given (nothing was touched — see "Guarantees" below)
#   3  Docker image build failed
#   4  database migration failed
#   5  containers failed to start or reach Docker-healthy in time
#   6  post-deploy smoke test failed (containers are up, response was wrong)
#
# Guarantees (see docs/Deployment.md#the-deployment-engine-deploysh):
#   - Never deletes a Docker volume. Nothing here runs `down -v`/`--volumes`
#     or `docker volume rm` — postgres/redis/media data outlives every step.
#   - Never resets the database. Only `prisma migrate deploy` runs — that's
#     forward-only and idempotent; no `migrate reset`, no `db push`, no seed.
#   - Never overwrites uploaded media. The media_storage volume is only
#     ever written to by the backend container, unchanged by a deploy.
#   - Never silently stashes or discards local changes. If the checkout has
#     uncommitted changes when it's time to reset to origin/main, deploy.sh
#     explains what it found and aborts — nothing is touched. Only with
#     --force does it proceed, and even then it stashes (named, timestamped,
#     recoverable with `git stash pop`) rather than discarding.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

# JSON_OUTPUT and the timing/stage state below are set before anything else
# (including argument parsing) so the on_exit trap — installed further
# down, fires on every exit path without exception — can always safely
# reference them, even for a failure that happens before --json itself is
# parsed.
JSON_OUTPUT=0
SKIP_JSON_EXIT=0
DEPLOY_START_EPOCH=$(date +%s)
CURRENT_STAGE="Argument parsing"
STAGE_EXIT_CODE=1

# ── Timestamped logging ───────────────────────────────────────────────────
# Every other deployment/*.sh script uses common.sh's log_* helpers as-is;
# deploy.sh is the one script explicitly required to timestamp every line
# (it's the one meant to run unattended, from cron/CI/COC, where a timestamp
# is often the only way to line up a failure with what else happened on the
# host at that moment) — so these wrap common.sh's versions here rather than
# changing logging for every script that sources common.sh. When --json is
# given, log_info/log_ok/log_step move to stderr too (log_warn/log_err
# already go there) so stdout carries nothing but the final JSON summary —
# a caller can safely treat "last line of stdout" as the whole result.
_ts() { date '+%Y-%m-%d %H:%M:%S'; }
log_info() {
  if [[ "${JSON_OUTPUT}" -eq 1 ]]; then printf '[%s] %s[INFO]%s %s\n' "$(_ts)" "${COLOR_BLUE}" "${COLOR_RESET}" "$*" >&2
  else printf '[%s] %s[INFO]%s %s\n' "$(_ts)" "${COLOR_BLUE}" "${COLOR_RESET}" "$*"
  fi
}
log_ok() {
  if [[ "${JSON_OUTPUT}" -eq 1 ]]; then printf '[%s] %s[ OK ]%s %s\n' "$(_ts)" "${COLOR_GREEN}" "${COLOR_RESET}" "$*" >&2
  else printf '[%s] %s[ OK ]%s %s\n' "$(_ts)" "${COLOR_GREEN}" "${COLOR_RESET}" "$*"
  fi
}
log_warn() { printf '[%s] %s[WARN]%s %s\n' "$(_ts)" "${COLOR_YELLOW}" "${COLOR_RESET}" "$*" >&2; }
log_err()  { printf '[%s] %s[FAIL]%s %s\n' "$(_ts)" "${COLOR_RED}" "${COLOR_RESET}" "$*" >&2; }
log_step() {
  if [[ "${JSON_OUTPUT}" -eq 1 ]]; then printf '\n[%s] %s%s%s\n' "$(_ts)" "${COLOR_BOLD}" "$*" "${COLOR_RESET}" >&2
  else printf '\n[%s] %s%s%s\n' "$(_ts)" "${COLOR_BOLD}" "$*" "${COLOR_RESET}"
  fi
}

# ── JSON result summary (installed before argument parsing so it's active
# for every possible exit, including an argument error) ────────────────────

# emit_json_result <result> <message> <exit_code> — the single JSON summary
# line printed to stdout when --json is given (see the --json option above
# for the field list). Called exactly once, from on_exit, so every exit
# path — normal completion, an explicit `exit N`, or the ERR trap further
# down — produces it without needing every call site to build it itself.
emit_json_result() {
  local result="$1" message="$2" exit_code="$3" commit commit_short branch duration
  commit="$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo unknown)"
  commit_short="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  branch="$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  duration=$(( $(date +%s) - DEPLOY_START_EPOCH ))
  printf '{"schema_version":"%s","script":"deploy.sh","deployment_engine":"%s","environment":"%s","version":"%s","commit":"%s","commit_short":"%s","branch":"%s","timestamp":"%s","duration_seconds":%s,"exit_code":%s,"result":"%s","stage":"%s","message":"%s"}\n' \
    "${SCHEMA_VERSION}" "${DEPLOYMENT_ENGINE_VERSION}" "$(json_escape "${DEPLOY_ENV}")" "$(json_escape "$(read_app_version)")" \
    "$(json_escape "${commit}")" "$(json_escape "${commit_short}")" "$(json_escape "${branch}")" "$(date -Iseconds)" \
    "${duration}" "${exit_code}" "$(json_escape "${result}")" "$(json_escape "${CURRENT_STAGE}")" "$(json_escape "${message}")"
}

on_exit() {
  local exit_code="$1"
  [[ "${JSON_OUTPUT}" -eq 1 && "${SKIP_JSON_EXIT}" -eq 0 ]] || return 0
  if [[ "${exit_code}" -eq 0 ]]; then
    emit_json_result "success" "Deploy complete (env: ${DEPLOY_ENV})." 0
  else
    emit_json_result "failed" "Deploy FAILED during: ${CURRENT_STAGE}." "${exit_code}"
  fi
}
trap 'on_exit "$?"' EXIT

# ── Argument parsing ───────────────────────────────────────────────────────

parse_common_flags "$@"
set -- "${REMAINING_ARGS[@]}"

SKIP_GIT=0
FORCE=0
RUN_SMOKE_TEST=1
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-git) SKIP_GIT=1; shift ;;
    --force) FORCE=1; shift ;;
    --no-smoke-test) RUN_SMOKE_TEST=0; shift ;;
    --health-timeout) HEALTH_TIMEOUT="$2"; shift 2 ;;
    --health-timeout=*) HEALTH_TIMEOUT="${1#--health-timeout=}"; shift ;;
    --json) JSON_OUTPUT=1; shift ;;
    -h|--help) SKIP_JSON_EXIT=1; grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

# deploy.sh is the release path for demo/production only — development uses
# hot-reload bind mounts and is driven directly via `docker compose -f
# compose.yml -f compose.dev.yml up`, never via a git-reset release script.
case "${DEPLOY_ENV}" in
  demo|production) ;;
  *)
    log_err "deploy.sh only supports --env demo or --env production (got '${DEPLOY_ENV}')."
    exit 1
    ;;
esac

# ── Failure handling / timing / history ───────────────────────────────────
# DEPLOY_START_EPOCH/CURRENT_STAGE/STAGE_EXIT_CODE were already initialized
# above (before argument parsing) — CURRENT_STAGE moves to "startup" here
# now that arguments are known good.

CURRENT_STAGE="startup"
HISTORY_FILE="${DEPLOYMENT_DIR}/.deploy-history.log"

print_duration() {
  local elapsed=$(( $(date +%s) - DEPLOY_START_EPOCH ))
  log_info "Deployment duration: $(format_duration "${elapsed}")"
}

# record_history <status> — one line per attempt, tab-separated, append-only
# (see lib/common.sh's "Deployment history" section for the full column
# list). rollback.sh reads this to find the last-known-good deployed
# commit; status.sh reads it to show "last deploy"; history.sh renders it
# as a table; sync_history_json regenerates deployment/history.json from it
# right after every append so the two never drift. Not committed to git
# (*.log and *.json under deployment/ are gitignored) — host-local state,
# same as backups/.
record_history() {
  local status="$1" commit duration branch
  commit="$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo unknown)"
  branch="$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  duration=$(( $(date +%s) - DEPLOY_START_EPOCH ))
  printf '%s\t%s\t%s\t%s\t%s\t%s\t\n' "$(date -Iseconds)" "${DEPLOY_ENV}" "${commit}" "${duration}" "${status}" "${branch}" >> "${HISTORY_FILE}" 2>/dev/null || true
  sync_history_json
}

on_error() {
  local raw_exit=$? line_no="$1"
  log_err "Deploy FAILED during: ${CURRENT_STAGE} (line ${line_no}, underlying exit code ${raw_exit})."
  record_history "FAILED(${CURRENT_STAGE})"
  print_duration
  exit "${STAGE_EXIT_CODE}"
}
trap 'on_error "${LINENO}"' ERR

# ── Helpers ────────────────────────────────────────────────────────────────

# smoke_test_container <desc> <service> <url> — HTTP GET <url> from inside
# <service>'s own container (via common.sh's http_check_in_container),
# rather than through a published host port or reverse proxy. This is what
# lets the smoke test pass regardless of how (or whether) a reverse proxy in
# front of Leinaflow is set up — Leinaflow itself doesn't publish app ports
# to the host by default in demo/production (see compose.demo.yml/
# compose.prod.yml), so a host-facing curl can't be assumed to work here.
smoke_test_container() {
  local desc="$1" service="$2" url="$3"
  if http_check_in_container "${service}" "${url}"; then
    log_ok "Smoke test passed: ${desc}"
    return 0
  fi
  log_err "Smoke test FAILED: ${desc} (${url} inside ${service})"
  return 1
}

# ── Main flow ──────────────────────────────────────────────────────────────

load_env
detect_compose_cmd

log_step "Leinaflow deploy — env: ${DEPLOY_ENV}"

# 1. Validate environment before doing anything
CURRENT_STAGE="Environment validation"; STAGE_EXIT_CODE=1
log_step "1. Validating environment"
"${DEPLOYMENT_DIR}/env-check.sh" --env "${DEPLOY_ENV}" ${ASSUME_YES:+-y}

# 2. Fetch latest git, reset to origin/main
CURRENT_STAGE="Git fetch/reset"; STAGE_EXIT_CODE=2
log_step "2. Fetching latest git and resetting to origin/main"
if [[ "${SKIP_GIT}" -eq 1 ]]; then
  log_warn "--skip-git passed — deploying whatever is currently checked out (not synced with origin/main)."
elif ! git -C "${PROJECT_ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log_err "${PROJECT_ROOT} is not a git repository — deploy.sh deploys from origin/main and needs one. Pass --skip-git to deploy the current directory as-is."
  exit "${STAGE_EXIT_CODE}"
elif ! git -C "${PROJECT_ROOT}" remote get-url origin >/dev/null 2>&1; then
  log_err "No 'origin' remote configured — cannot fetch/reset. Add one, or pass --skip-git."
  exit "${STAGE_EXIT_CODE}"
else
  log_info "Fetching origin..."
  git -C "${PROJECT_ROOT}" fetch origin main --tags --quiet
  log_ok "Fetched origin/main ($(git -C "${PROJECT_ROOT}" rev-parse --short origin/main))."

  DIRTY_STATUS="$(git -C "${PROJECT_ROOT}" status --porcelain)"
  if [[ -n "${DIRTY_STATUS}" ]]; then
    if [[ "${FORCE}" -ne 1 ]]; then
      log_err "Uncommitted local changes on this host — refusing to reset to origin/main."
      echo "${DIRTY_STATUS}" | sed 's/^/    /' >&2
      log_err "Nothing was touched. Commit or stash these yourself, or re-run with --force to have deploy.sh stash them (named, timestamped, recoverable) and continue."
      exit "${STAGE_EXIT_CODE}"
    fi
    STASH_MSG="deploy.sh --force deploy (${DEPLOY_ENV}) $(_ts)"
    log_warn "Uncommitted local changes on this host — --force given, stashing (not discarding) before reset: ${STASH_MSG}"
    git -C "${PROJECT_ROOT}" stash push -u -m "${STASH_MSG}"
    log_info "Recoverable later with: git stash list / git stash pop"
  fi

  log_info "Resetting checkout to origin/main..."
  git -C "${PROJECT_ROOT}" checkout main --quiet 2>/dev/null \
    || git -C "${PROJECT_ROOT}" checkout -b main --track origin/main --quiet
  git -C "${PROJECT_ROOT}" reset --hard origin/main --quiet
  log_ok "Checkout reset to origin/main ($(git -C "${PROJECT_ROOT}" rev-parse --short HEAD))."
fi

# 3. Build Docker images
CURRENT_STAGE="Docker image build"; STAGE_EXIT_CODE=3
log_step "3. Building Docker images"
dc build
log_ok "Docker images built."

# 4. Run database migrations (forward-only — never resets/seeds the database)
CURRENT_STAGE="Database migration"; STAGE_EXIT_CODE=4
log_step "4. Running database migrations"
log_info "Starting postgres/redis so migrations have a database to apply against..."
dc up -d postgres redis
wait_for_service_healthy postgres 60
wait_for_service_healthy redis 60
log_info "Running prisma migrate deploy..."
dc run --rm -T --no-deps backend npm run prisma:migrate:deploy
log_ok "Migrations applied (forward-only — no data was reset)."

# 5. Start containers
CURRENT_STAGE="Starting containers"; STAGE_EXIT_CODE=5
log_step "5. Starting containers"
if ! dc up -d --wait --wait-timeout "${HEALTH_TIMEOUT}"; then
  log_err "Containers did not all reach a healthy state within ${HEALTH_TIMEOUT}s."
  dc ps
  exit "${STAGE_EXIT_CODE}"
fi
log_ok "Containers started."

# 6. Wait for / verify backend and frontend health individually
CURRENT_STAGE="Health verification"; STAGE_EXIT_CODE=5
log_step "6. Verifying backend and frontend health"
for svc in backend frontend; do
  wait_for_service_healthy "${svc}" "${HEALTH_TIMEOUT}"
  log_ok "${svc}: healthy"
done

# 7. Smoke tests
CURRENT_STAGE="Smoke tests"; STAGE_EXIT_CODE=6
if [[ "${RUN_SMOKE_TEST}" -eq 1 ]]; then
  log_step "7. Running smoke tests"
  # Checked from inside each container (see smoke_test_container above) —
  # not through nginx (removed) and not assuming a published host port,
  # since whether/how a reverse proxy reaches these containers is an
  # infrastructure decision this repo doesn't make.
  smoke_test_container "backend /v1/health" backend "http://localhost:4000/v1/health"
  smoke_test_container "frontend /" frontend "http://localhost:3000"
  log_ok "Smoke tests passed."
else
  log_step "7. Smoke tests skipped (--no-smoke-test)"
fi

# 8. Summary
CURRENT_STAGE="Summary"
log_step "8. Deploy summary"
DEPLOYED_COMMIT="$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo unknown)"
DEPLOYED_COMMIT_SHORT="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)"
DEPLOYED_SUBJECT="$(git -C "${PROJECT_ROOT}" log -1 --format=%s 2>/dev/null || echo '')"
log_ok "Deployed commit: ${DEPLOYED_COMMIT_SHORT} (${DEPLOYED_COMMIT})${DEPLOYED_SUBJECT:+ — ${DEPLOYED_SUBJECT}}"
print_duration
record_history "SUCCESS"
ensure_server_identity

log_ok "Deploy complete (env: ${DEPLOY_ENV})."
exit 0
