#!/usr/bin/env bash
# rollback.sh — roll back a bad deploy. v1: implements the code-rollback
# path end-to-end; the data-rollback path is documented here but
# deliberately delegates to restore.sh rather than reimplementing it. See
# docs/deployment/Rollback.md for the full narrative this mirrors.
#
# ── The two things that can go wrong, and how each rolls back ────────────
#
# 1. BAD CODE (the common case) — what this script does:
#      Pick a target commit (an explicit --to <ref>, or by default the most
#      recent commit that deploy.sh itself recorded as a SUCCESS for this
#      env in deployment/.deploy-history.log, other than the one currently
#      running), `git checkout --detach` to it, rebuild, restart, wait for
#      health, run healthcheck.sh. No data is touched — postgres/redis/media
#      volumes are untouched throughout. If the checkout has uncommitted
#      local changes, this refuses to proceed unless --force is given (see
#      Options below) — same contract as deploy.sh.
#
# 2. BAD DATA (a migration or seed needs undoing) — NOT implemented here:
#      this needs restoring the database/media from a pre-migration backup,
#      which is destructive and already fully implemented in restore.sh.
#      This script refuses to attempt it — run instead:
#        deployment/restore.sh --env <env> --dry-run   # preview, touches nothing
#        deployment/restore.sh --env <env>              # restore for real
#      `rollback.sh --data-rollback` prints this same guidance and exits
#      without changing anything.
#
# Usage:
#   deployment/rollback.sh --env demo|production [-y|--yes]
#   deployment/rollback.sh --env production --to <commit-ish>
#   deployment/rollback.sh --env production                # rolls back to
#                                                            # the last commit
#                                                            # deploy.sh
#                                                            # successfully
#                                                            # deployed before
#                                                            # the current one
#   deployment/rollback.sh --data-rollback                  # print the data
#                                                            # rollback flow
#                                                            # and exit
#
# Options:
#   --force   Required to proceed when the checkout has uncommitted local
#             changes. Without it, rollback.sh explains what it found and
#             aborts untouched. With it, those changes are stashed (named,
#             timestamped, recoverable) before the checkout.
#   --json    Send all human progress output to stderr and print a single
#             machine-readable JSON summary to stdout as the last line
#             (schema_version/script/environment/version/commit/branch/
#             from_commit/to_commit/timestamp/duration_seconds/exit_code/
#             result/stage/message — see docs/COC-Integration.md). Same
#             exit codes either way; purely additive.
#
# IMPORTANT: after a code rollback, this host's checkout is behind
# origin/main (detached HEAD at the rollback target) until a real fix is
# pushed and redeployed. The next `deploy.sh` run will reset it back to
# origin/main's tip — including whatever was wrong — so land and deploy the
# actual fix before running deploy.sh again.
#
# Exit codes:
#   0  rolled back and verified healthy
#   1  argument/environment validation failed, or no rollback target found
#   2  git checkout failed, or uncommitted changes were found and --force
#      was not given (nothing was touched)
#   3  Docker image build failed
#   4  containers failed to start or reach Docker-healthy in time

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

# All state the on_exit trap (installed below, before argument parsing) can
# reference — initialized before anything else so it's always safe even for
# a failure that happens before the relevant value is normally resolved.
JSON_OUTPUT=0
SKIP_JSON_EXIT=0
CANCELLED=0
CURRENT_COMMIT=""
TARGET_COMMIT=""
TARGET_SHORT=""
ROLLBACK_START_EPOCH=$(date +%s)
CURRENT_STAGE="Argument parsing"
STAGE_EXIT_CODE=1

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
# for every possible exit) ─────────────────────────────────────────────────

# emit_json_result <result> <message> <exit_code> — mirrors deploy.sh's
# helper of the same name; see its comment for why this lives in on_exit
# rather than at each call site. from_commit/to_commit are null until
# CURRENT_COMMIT/TARGET_COMMIT are resolved (e.g. an argument error fires
# before either is known).
emit_json_result() {
  local result="$1" message="$2" exit_code="$3" commit commit_short branch duration
  commit="$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo unknown)"
  commit_short="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  branch="$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  duration=$(( $(date +%s) - ROLLBACK_START_EPOCH ))
  local from_commit_json="null" to_commit_json="null"
  [[ -n "${CURRENT_COMMIT}" ]] && from_commit_json="\"$(json_escape "${CURRENT_COMMIT}")\""
  [[ -n "${TARGET_COMMIT}" ]] && to_commit_json="\"$(json_escape "${TARGET_COMMIT}")\""
  printf '{"schema_version":"%s","script":"rollback.sh","deployment_engine":"%s","environment":"%s","version":"%s","commit":"%s","commit_short":"%s","branch":"%s","from_commit":%s,"to_commit":%s,"timestamp":"%s","duration_seconds":%s,"exit_code":%s,"result":"%s","stage":"%s","message":"%s"}\n' \
    "${SCHEMA_VERSION}" "${DEPLOYMENT_ENGINE_VERSION}" "$(json_escape "${DEPLOY_ENV}")" "$(json_escape "$(read_app_version)")" \
    "$(json_escape "${commit}")" "$(json_escape "${commit_short}")" "$(json_escape "${branch}")" \
    "${from_commit_json}" "${to_commit_json}" \
    "$(date -Iseconds)" "${duration}" "${exit_code}" "$(json_escape "${result}")" "$(json_escape "${CURRENT_STAGE}")" "$(json_escape "${message}")"
}

on_exit() {
  local exit_code="$1" result message
  [[ "${JSON_OUTPUT}" -eq 1 && "${SKIP_JSON_EXIT}" -eq 0 ]] || return 0
  if [[ "${exit_code}" -eq 0 ]]; then
    if [[ -n "${TARGET_COMMIT}" && "${TARGET_COMMIT}" == "${CURRENT_COMMIT}" ]]; then
      result="noop"; message="Target commit is the same as HEAD — nothing to roll back."
    else
      result="success"; message="Rollback complete — ${DEPLOY_ENV} is now running ${TARGET_SHORT}."
    fi
  elif [[ "${CANCELLED}" -eq 1 ]]; then
    result="cancelled"; message="Rollback cancelled by operator."
  else
    result="failed"; message="Rollback FAILED during: ${CURRENT_STAGE}."
  fi
  emit_json_result "${result}" "${message}" "${exit_code}"
}
trap 'on_exit "$?"' EXIT

print_data_rollback_flow() {
  sed -n '/^# 2\. BAD DATA/,/without changing anything\./p' "$0" | sed 's/^# \{0,1\}//'
}

parse_common_flags "$@"
set -- "${REMAINING_ARGS[@]}"

TARGET_REF=""
DATA_ROLLBACK=0
FORCE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --to) TARGET_REF="$2"; shift 2 ;;
    --to=*) TARGET_REF="${1#--to=}"; shift ;;
    --data-rollback) DATA_ROLLBACK=1; shift ;;
    --force) FORCE=1; shift ;;
    --json) JSON_OUTPUT=1; shift ;;
    -h|--help) SKIP_JSON_EXIT=1; grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ "${DATA_ROLLBACK}" -eq 1 ]]; then
  SKIP_JSON_EXIT=1
  echo "rollback.sh does not perform data rollback itself — it's a destructive"
  echo "operation already fully implemented in restore.sh. The flow:"
  echo
  print_data_rollback_flow
  exit 0
fi

case "${DEPLOY_ENV}" in
  demo|production) ;;
  *)
    log_err "rollback.sh only supports --env demo or --env production (got '${DEPLOY_ENV}')."
    exit 1
    ;;
esac

load_env
detect_compose_cmd

HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
HISTORY_FILE="${DEPLOYMENT_DIR}/.deploy-history.log"
CURRENT_STAGE="startup"

# record_rollback_history <status> — one line per attempt, tab-separated,
# append-only, same 7-column shape deploy.sh's record_history writes (see
# lib/common.sh's "Deployment history" section) — commit/branch are HEAD's
# actual state at record time (so a rollback that fails partway through
# still reflects whatever git state it left behind), from_commit is what
# this rollback was attempted from. Called on both success and failure so
# COC/history.sh can see failed rollback attempts too, not just successful
# ones.
record_rollback_history() {
  local status="$1" commit branch duration
  commit="$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo unknown)"
  branch="$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  duration=$(( $(date +%s) - ROLLBACK_START_EPOCH ))
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$(date -Iseconds)" "${DEPLOY_ENV}" "${commit}" "${duration}" "${status}" "${branch}" "${CURRENT_COMMIT}" >> "${HISTORY_FILE}" 2>/dev/null || true
  sync_history_json
}

on_error() {
  local raw_exit=$? line_no="$1"
  log_err "Rollback FAILED during: ${CURRENT_STAGE} (line ${line_no}, underlying exit code ${raw_exit})."
  record_rollback_history "FAILED(${CURRENT_STAGE})"
  exit "${STAGE_EXIT_CODE}"
}
trap 'on_error "${LINENO}"' ERR

log_step "Leinaflow rollback — env: ${DEPLOY_ENV}"

# ── Resolve the rollback target ───────────────────────────────────────────
CURRENT_STAGE="Resolving rollback target"; STAGE_EXIT_CODE=1

CURRENT_COMMIT="$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || true)"
[[ -n "${CURRENT_COMMIT}" ]] || { log_err "${PROJECT_ROOT} is not a git repository."; exit 1; }

if [[ -n "${TARGET_REF}" ]]; then
  log_info "Target ref given explicitly: ${TARGET_REF}"
  git -C "${PROJECT_ROOT}" fetch origin --tags --quiet 2>/dev/null || true
  TARGET_COMMIT="$(git -C "${PROJECT_ROOT}" rev-parse "${TARGET_REF}^{commit}" 2>/dev/null || true)"
  [[ -n "${TARGET_COMMIT}" ]] || { log_err "Could not resolve '${TARGET_REF}' to a commit."; exit 1; }
else
  log_info "No --to given — looking for the last-known-good deploy of '${DEPLOY_ENV}' in ${HISTORY_FILE}"
  [[ -f "${HISTORY_FILE}" ]] || { log_err "No ${HISTORY_FILE} found — nothing to roll back to. Pass --to <commit-ish>."; exit 1; }

  TARGET_COMMIT="$(awk -F'\t' -v env="${DEPLOY_ENV}" -v cur="${CURRENT_COMMIT}" \
    '$2 == env && $5 == "SUCCESS" && $3 != cur {commit = $3} END {print commit}' "${HISTORY_FILE}")"
  [[ -n "${TARGET_COMMIT}" ]] || {
    log_err "No prior SUCCESS deploy of '${DEPLOY_ENV}' found in ${HISTORY_FILE} other than the current commit (${CURRENT_COMMIT:0:12}). Pass --to <commit-ish>."
    exit 1
  }
fi

TARGET_SHORT="$(git -C "${PROJECT_ROOT}" rev-parse --short "${TARGET_COMMIT}")"
log_ok "Rollback target: ${TARGET_SHORT} (${TARGET_COMMIT})"

if [[ "${TARGET_COMMIT}" == "${CURRENT_COMMIT}" ]]; then
  log_warn "Target commit is the same as HEAD (${CURRENT_COMMIT:0:12}) — nothing to roll back."
  exit 0
fi

confirm "Roll back ${DEPLOY_ENV} from ${CURRENT_COMMIT:0:12} to ${TARGET_SHORT}? This rebuilds and restarts containers (no data is touched)." \
  || { CANCELLED=1; log_info "Rollback cancelled."; exit 1; }

# ── Check out the target commit ───────────────────────────────────────────
CURRENT_STAGE="Git checkout"; STAGE_EXIT_CODE=2
log_step "1. Checking out rollback target"
DIRTY_STATUS="$(git -C "${PROJECT_ROOT}" status --porcelain)"
if [[ -n "${DIRTY_STATUS}" ]]; then
  if [[ "${FORCE}" -ne 1 ]]; then
    log_err "Uncommitted local changes on this host — refusing to check out the rollback target."
    echo "${DIRTY_STATUS}" | sed 's/^/    /' >&2
    log_err "Nothing was touched. Commit or stash these yourself, or re-run with --force to have rollback.sh stash them (named, timestamped, recoverable) and continue."
    exit "${STAGE_EXIT_CODE}"
  fi
  STASH_MSG="rollback.sh --force rollback to ${TARGET_SHORT} (${DEPLOY_ENV}) $(_ts)"
  log_warn "Uncommitted local changes on this host — --force given, stashing (not discarding) before checkout: ${STASH_MSG}"
  git -C "${PROJECT_ROOT}" stash push -u -m "${STASH_MSG}"
  log_info "Recoverable later with: git stash list / git stash pop"
fi
git -C "${PROJECT_ROOT}" checkout --detach "${TARGET_COMMIT}" --quiet
log_ok "Checked out ${TARGET_SHORT} (detached HEAD)."
log_warn "HEAD is now detached at ${TARGET_SHORT}, behind origin/main. The next deploy.sh run resets back to origin/main's tip — land and deploy the real fix before running it again."

# ── Rebuild and restart ────────────────────────────────────────────────────
CURRENT_STAGE="Docker image build"; STAGE_EXIT_CODE=3
log_step "2. Rebuilding Docker images"
dc build
log_ok "Docker images built."

CURRENT_STAGE="Starting containers"; STAGE_EXIT_CODE=4
log_step "3. Restarting containers"
if ! dc up -d --wait --wait-timeout "${HEALTH_TIMEOUT}"; then
  log_err "Containers did not all reach a healthy state within ${HEALTH_TIMEOUT}s."
  dc ps
  exit "${STAGE_EXIT_CODE}"
fi
log_ok "Containers restarted."

CURRENT_STAGE="Health verification"; STAGE_EXIT_CODE=4
log_step "4. Verifying health"
"${DEPLOYMENT_DIR}/healthcheck.sh" --env "${DEPLOY_ENV}"

record_rollback_history "ROLLBACK"
ensure_server_identity

ROLLBACK_DURATION=$(( $(date +%s) - ROLLBACK_START_EPOCH ))
log_ok "Rollback complete — ${DEPLOY_ENV} is now running ${TARGET_SHORT} ($(format_duration "${ROLLBACK_DURATION}"))."
exit 0
