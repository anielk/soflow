#!/usr/bin/env bash
# Shared helpers for deployment/*.sh.
#
# This file is a library — it must be sourced, never executed directly:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"
#
# It centralizes everything every deployment script needs so behavior (env
# resolution, compose invocation, logging, non-interactive/COC support)
# stays identical across install/update/backup/restore/healthcheck/uninstall.

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "common.sh is a library — source it from another script, don't run it directly." >&2
  exit 1
fi

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "${LIB_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DEPLOYMENT_DIR}/.." && pwd)"
export LIB_DIR DEPLOYMENT_DIR PROJECT_ROOT

# RESOURCE_PREFIX — the prefix every Docker resource name (containers,
# network, volumes) uses; must match compose.yml's `${PROJECT_NAME:-creator}`
# exactly. Read directly from root .env here (rather than via load_env,
# which runs later in most scripts) so it's available to every script from
# the start, including create_folders/check_ports which run before load_env.
PROJECT_NAME="$(grep -m1 '^PROJECT_NAME=' "${PROJECT_ROOT}/.env" 2>/dev/null | cut -d= -f2-)"
RESOURCE_PREFIX="${PROJECT_NAME:-creator}"
export PROJECT_NAME RESOURCE_PREFIX

# DEPLOYMENT_ENGINE_VERSION / SCHEMA_VERSION — identify, respectively, this
# deployment tooling's own version (deploy.sh/rollback.sh/status.sh — see
# docs/COC-Integration.md) and the shape of the JSON these scripts emit.
# Both are embedded in every --json output and in deployment/server.json so
# the future Cloudivo Operations Center (COC) can tell tooling versions and
# payload shapes apart across hosts running different Leinaflow versions.
DEPLOYMENT_ENGINE_VERSION="1.0"
SCHEMA_VERSION="1.0"
export DEPLOYMENT_ENGINE_VERSION SCHEMA_VERSION

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

# format_duration <seconds> — human-readable elapsed time, e.g. "1m 30s".
# Shared by deploy.sh/rollback.sh (printed to the operator) and history.sh
# (rendering the raw seconds stored in deployment/.deploy-history.log).
format_duration() {
  local total="$1" h m s
  h=$((total / 3600)); m=$(((total % 3600) / 60)); s=$((total % 60))
  if [[ "${h}" -gt 0 ]]; then printf '%dh %dm %ds' "${h}" "${m}" "${s}"
  elif [[ "${m}" -gt 0 ]]; then printf '%dm %ds' "${m}" "${s}"
  else printf '%ds' "${s}"
  fi
}

# ── JSON output (shared by deploy.sh/rollback.sh/status.sh/history.sh --json) ──
#
# Every script's --json output is built by hand with printf, not a JSON
# library — deployment scripts can't assume jq is installed on every host
# (only bootstrap.sh's package list guarantees it — see
# bootstrap/02-install-packages.sh). json_escape is what keeps that safe:
# every value that can contain arbitrary text (commit subjects, error
# messages, hostnames) must be passed through it before going inside quotes.

# json_escape <string> — escapes backslash, double-quote and control chars
# for embedding as a JSON string value. Does not add the surrounding quotes.
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\t'/\\t}"
  s="${s//$'\r'/}"
  s="${s//$'\n'/\\n}"
  printf '%s' "${s}"
}

# read_app_version — Leinaflow's version, from backend/package.json's
# "version" field (the same value backend's own /v1/system/version
# endpoint reports — see SystemService.readAppVersion). Prefers jq when
# available, falls back to grep/sed otherwise — same pattern already used
# by bootstrap/09-summary.sh, so this doesn't newly require jq on a host
# that wasn't provisioned via bootstrap.sh.
read_app_version() {
  local pkg="${PROJECT_ROOT}/backend/package.json"
  [[ -f "${pkg}" ]] || { echo "unknown"; return; }
  if command -v jq >/dev/null 2>&1; then
    jq -r '.version // "unknown"' "${pkg}" 2>/dev/null || echo "unknown"
  else
    grep -m1 '"version"' "${pkg}" 2>/dev/null | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/' || echo "unknown"
  fi
}

# detect_installed_environment — reads deployment/server.json's
# "environment" field: this host's actual last-installed/deployed
# environment (written by install.sh, refreshed by every successful
# deploy.sh/rollback.sh run — see ensure_server_identity below). Used as
# DEPLOY_ENV's default (see "Deployment environment" further down) instead
# of a hardcoded guess, so a script invoked without --env (status.sh in
# particular is routinely run that way, just to check on things) reports on
# what this host actually is, not whatever the fallback happens to be.
# Prints nothing and returns 1 if server.json doesn't exist yet or has no
# environment field — callers must treat that as "unknown", not "development".
detect_installed_environment() {
  local file="${DEPLOYMENT_DIR}/server.json" env=""
  [[ -f "${file}" ]] || return 1
  if command -v jq >/dev/null 2>&1; then
    env="$(jq -r '.environment // empty' "${file}" 2>/dev/null)"
  else
    env="$(grep -m1 '"environment"' "${file}" 2>/dev/null | sed -E 's/.*"environment"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
  fi
  [[ -n "${env}" ]] || return 1
  printf '%s' "${env}"
}

# ── Server identity (deployment/server.json) ─────────────────────────────
#
# See docs/COC-Integration.md#server-discovery. server.json is host-local
# (gitignored, like .deploy-history.log) — it's how the future Cloudivo
# Operations Center (COC) will eventually discover and recognize a running
# install without any of this being wired up yet.

# generate_server_id — a stable per-host identifier. Prefers uuidgen; falls
# back to formatting generate_secret's random hex into the same shape so a
# host without uuidgen (not installed by bootstrap.sh, only by convention on
# most distros) still gets a usable id.
generate_server_id() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen
  else
    local hex; hex="$(generate_secret | cut -c1-32)"
    printf '%s-%s-%s-%s-%s\n' "${hex:0:8}" "${hex:8:4}" "${hex:12:4}" "${hex:16:4}" "${hex:20:12}"
  fi
}

# ensure_server_identity — creates deployment/server.json on first call
# (generating and permanently fixing serverId, the same "generate once,
# never touch again" approach as JWT_SECRET/SESSION_SECRET — see
# ensure_env_files), then refreshes it every time it's called after that so
# version/environment/hostname always reflect what's actually running.
# Called by install.sh (creation) and deploy.sh/rollback.sh (refresh after
# every successful run) — never fails the caller's script if it can't write
# the file (host-local convenience data, not part of the deploy contract).
ensure_server_identity() {
  local file="${DEPLOYMENT_DIR}/server.json" server_id=""
  if [[ -f "${file}" ]]; then
    if command -v jq >/dev/null 2>&1; then
      server_id="$(jq -r '.serverId // empty' "${file}" 2>/dev/null)"
    else
      server_id="$(grep -m1 '"serverId"' "${file}" 2>/dev/null | sed -E 's/.*"serverId"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
    fi
  fi
  [[ -n "${server_id}" ]] || server_id="$(generate_server_id)"

  printf '{\n  "serverId": "%s",\n  "environment": "%s",\n  "hostname": "%s",\n  "platform": "Leinaflow",\n  "version": "%s",\n  "deploymentEngine": "%s",\n  "updatedAt": "%s"\n}\n' \
    "$(json_escape "${server_id}")" \
    "$(json_escape "${DEPLOY_ENV}")" \
    "$(json_escape "$(hostname 2>/dev/null || echo unknown)")" \
    "$(json_escape "$(read_app_version)")" \
    "${DEPLOYMENT_ENGINE_VERSION}" \
    "$(date -Iseconds)" \
    > "${file}" 2>/dev/null || true
}

# ── Deployment history (deployment/.deploy-history.log + history.json) ──
#
# .deploy-history.log stays exactly what it always was: a tab-separated,
# append-only, host-local log — deploy.sh/rollback.sh only ever append a
# line, never rewrite it. Columns (1-indexed, new ones added at the end so
# awk/read scripts keyed on earlier column numbers don't need to change):
#   1 timestamp  2 environment  3 commit  4 duration_seconds  5 status
#   6 branch     7 from_commit (rollback only; empty otherwise)
# history.json is a *derived* artifact regenerated from that log in full
# every time sync_history_json runs — it's never appended to directly, so
# there's no risk of ending up with invalid/partial JSON.

# history_line_to_json <tab-separated-row> — converts one history-log row
# into a single JSON object. Shared by sync_history_json (writes
# deployment/history.json) and history.sh --json, so the two never drift.
history_line_to_json() {
  local line="$1" ts env commit duration status branch from_commit
  IFS=$'\t' read -r ts env commit duration status branch from_commit <<< "${line}"
  local is_rollback="false"
  [[ "${status}" == "ROLLBACK" ]] && is_rollback="true"
  local from_commit_json="null"
  [[ -n "${from_commit}" ]] && from_commit_json="\"${from_commit}\""
  printf '{"timestamp":"%s","environment":"%s","commit":"%s","commit_short":"%s","branch":"%s","duration_seconds":%s,"status":"%s","rollback":{"is_rollback":%s,"from_commit":%s}}' \
    "$(json_escape "${ts}")" "$(json_escape "${env}")" "$(json_escape "${commit}")" "$(json_escape "${commit:0:12}")" \
    "$(json_escape "${branch:-unknown}")" "${duration:-0}" "$(json_escape "${status}")" "${is_rollback}" "${from_commit_json}"
}

# sync_history_json — regenerates deployment/history.json from
# deployment/.deploy-history.log in full. Called at the end of
# record_history (deploy.sh) and its rollback.sh equivalent so the two
# files can never drift out of sync with each other.
sync_history_json() {
  local history_file="${DEPLOYMENT_DIR}/.deploy-history.log" json_file="${DEPLOYMENT_DIR}/history.json"
  {
    if [[ ! -s "${history_file}" ]]; then
      printf '[]\n'
    else
      printf '['
      local first=1 line
      while IFS= read -r line; do
        [[ -z "${line}" ]] && continue
        [[ "${first}" -eq 1 ]] && first=0 || printf ','
        history_line_to_json "${line}"
      done < "${history_file}"
      printf ']\n'
    fi
  } > "${json_file}" 2>/dev/null || true
}

# fetch_backend_health_report [timeout] — fetches the backend's real
# /v1/health JSON from inside its own container (works identically in
# development/demo/production — no dependency on how, or whether, a reverse
# proxy or published host port reaches it) and
# prints it as: line 1 = overall status, line 2 = uptimeSeconds, then one
# "name<TAB>status" line per check (see HealthReport in
# backend/src/health/health.service.ts — this is that same contract).
# Prints nothing (not an error) if the backend doesn't respond in time —
# callers must treat empty output as "unknown", not "down".
fetch_backend_health_report() {
  local to="${1:-5}" to_ms
  to_ms=$(( to * 1000 ))
  # Deliberately NOT `timeout ... dc exec ...`: `timeout` execs its command
  # directly — it has no shell, so it can't see dc(), which is a bash
  # function, not a binary on $PATH. `timeout N dc ...` either fails
  # outright ("dc: No such file or directory") or, on a host that happens
  # to have the real `dc` (the POSIX arbitrary-precision calculator)
  # installed, silently runs THAT instead, fed "exec -T backend node -e
  # ..." as calculator input — either way producing no health report, with
  # no error surfaced to the caller. ${COMPOSE} ("docker compose" or
  # "docker-compose") is a real binary, so build the exact command dc()
  # would run and hand *that* to timeout instead — same cd-to-PROJECT_ROOT
  # and ERR-trap-reset dc() gives every other caller (see dc()'s comment).
  #
  # The Node script itself never relies on the event loop draining on its
  # own to exit: `res.on('end', ...)` completing does NOT guarantee no
  # handle is still open (a completed HTTP response can leave its socket
  # alive for a tick — keep-alive teardown, DNS resolver cleanup — and
  # exactly how long depends on Node version/timing, not on this script).
  # process.exit() is called unconditionally once the response is fully
  # read, and req.setTimeout() gives the request its own internal deadline
  # so a connection that never completes at all doesn't wait around for
  # the outer `timeout` to notice — that outer `timeout` stays purely as a
  # last-resort net for a hang *before* Node even starts (e.g. `docker
  # compose exec` itself stalling), not as the thing making Node exit.
  #
  # `< /dev/null` on the exec itself: `-T` only disables pseudo-tty
  # allocation, it does NOT detach stdin — `docker compose exec` (and
  # `docker-compose` even more so) still attaches the caller's stdin by
  # default. status.sh's own stdin is whatever *its* caller gave it; run
  # non-interactively (a poller/cron/CI invoking `--json`, unlike a human
  # running the plain-text report at a terminal) that's often a pipe that
  # never reaches EOF, and the exec then blocks waiting to read from it —
  # a wait the outer `timeout` above does not bound, since it's stuck
  # before the remote Node script (and its own req.setTimeout) ever runs.
  # shellcheck disable=SC2086,SC2046
  (
    trap - ERR
    cd "${PROJECT_ROOT}" || exit 1
    timeout "${to}" ${COMPOSE} $(compose_files) exec -T backend node -e "
      const req = require('http').get('http://localhost:4000/v1/health', (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          let exitCode = 0;
          try {
            const r = JSON.parse(data);
            console.log(r.status);
            console.log(r.uptimeSeconds);
            for (const c of (r.checks || [])) console.log(c.name + '\t' + c.status);
          } catch (e) { exitCode = 1; }
          process.exit(exitCode);
        });
      });
      req.setTimeout(${to_ms}, () => { req.destroy(); process.exit(1); });
      req.on('error', () => process.exit(1));
    " < /dev/null
  ) 2>/dev/null || true
}

# ── Non-interactive / COC support ────────────────────────────────────────
#
# Every script exposes -y/--yes (sets ASSUME_YES=1) so it can run
# unattended. confirm()/confirm_typed() are the only prompting primitives —
# route all interactive checks through them so "run non-interactively" stays
# a single, consistent contract for the Cloudivo Operations Center (COC) to
# rely on.

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
# development -> compose.yml + compose.dev.yml (hot-reload, bind mounts,
#   published dev ports)
# demo        -> compose.yml + compose.demo.yml (production build, no ports
#   published to the host by default — see check_ports above)
# production  -> compose.yml + compose.prod.yml (identical build/runtime
#   config to demo — see docs/deployment/Architecture.md — only the
#   per-host .env / .env.production content differs)
# Nothing here is hardcoded to a specific host/port — those come from .env.
#
# Default resolution, in order: an explicit `--env` flag (handled by
# parse_common_flags, which runs later and overrides whatever's set here);
# DEPLOY_ENV already set in the calling shell's environment; this host's
# own server.json (what it was actually installed/last deployed as — see
# detect_installed_environment above); "production" only as a last resort,
# for a host that hasn't been installed yet. Without the server.json step,
# a script run with no flags on an already-installed demo/production host
# would silently default to "production" regardless of which one this host
# actually is — status.sh in particular is routinely run with no flags.

if [[ -z "${DEPLOY_ENV:-}" ]]; then
  DEPLOY_ENV="$(detect_installed_environment 2>/dev/null || true)"
fi
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
# via `env_file:` in compose.yml (see compose.yml's backend
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
    development) echo "-f ${PROJECT_ROOT}/compose.yml -f ${PROJECT_ROOT}/compose.dev.yml" ;;
    demo) echo "-f ${PROJECT_ROOT}/compose.yml -f ${PROJECT_ROOT}/compose.demo.yml" ;;
    production) echo "-f ${PROJECT_ROOT}/compose.yml -f ${PROJECT_ROOT}/compose.prod.yml" ;;
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
  # `trap - ERR` inside the subshell: callers (deploy.sh/rollback.sh) set
  # `-E` so their own ERR trap reaches into functions like this one — but
  # that same `-E` also makes it reach into this subshell, so without
  # resetting it here a failing compose command fires the caller's ERR
  # trap once *inside* the subshell (on its own exit) and once *again* in
  # the caller when the subshell itself (as `dc`'s exit status) comes back
  # non-zero — double-running on_error, double-logging, double-appending
  # to the history log. Resetting it here means the failure still
  # propagates (errexit still applies, and the subshell's exit status is
  # still whatever the compose command returned) — it just only trips the
  # trap once, in the caller, where it belongs.
  #
  # Intentional word-splitting: COMPOSE ("docker compose") and compose_files
  # (multiple "-f <file>" pairs) are both meant to expand into several words.
  # shellcheck disable=SC2086,SC2046
  (trap - ERR; cd "${PROJECT_ROOT}" && ${COMPOSE} $(compose_files) "$@")
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

# wait_for_service_healthy <service> [timeout] — poll Docker's own
# HEALTHCHECK status (not an HTTP check) until "healthy" or the timeout
# elapses. Every service in compose.yml defines a healthcheck (postgres,
# redis, backend, frontend — see docs/deployment/Architecture.md#healthchecks),
# so this is the one thing
# deploy.sh, rollback.sh and status.sh all need and none of the existing
# scripts expose as a shared helper (install.sh has its own near-identical
# local copy predating this one — not unified here to avoid touching a
# working, unrelated script).
wait_for_service_healthy() {
  local service="$1" timeout="${2:-90}" waited=0 cid status
  cid="$(dc ps -q "${service}" 2>/dev/null || true)"
  if [[ -z "${cid}" ]]; then
    log_err "${service}: container not found."
    return 1
  fi
  while [[ "${waited}" -lt "${timeout}" ]]; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "${cid}" 2>/dev/null || echo "unknown")"
    if [[ "${status}" == "healthy" || "${status}" == "no-healthcheck" ]]; then
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
  done
  log_err "${service}: did not become healthy within ${timeout}s (last status: ${status})."
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

# sudo_run <cmd...> — run as root directly, or via sudo when not already root.
sudo_run() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    require_cmd sudo
    sudo "$@"
  fi
}

# ── Resource checks ──────────────────────────────────────────────────────
#
# Shared by env-check.sh and bootstrap/01-system-check.sh so the thresholds
# and messaging can't drift between the two. Disk space below MIN_DISK_GB is
# a hard failure (returns 1); memory/CPU shortfalls are warnings only.
check_resources() {
  local ok=0 available_kb available_gb total_mem_mb cpu_cores

  available_kb="$(df -Pk "${PROJECT_ROOT}" | awk 'NR==2 {print $4}')"
  available_gb=$((available_kb / 1024 / 1024))
  if [[ "${available_gb}" -ge "${MIN_DISK_GB}" ]]; then
    log_ok "Disk space: ${available_gb}GB available (minimum ${MIN_DISK_GB}GB)"
  else
    log_err "Disk space: only ${available_gb}GB available, minimum ${MIN_DISK_GB}GB required (override with MIN_DISK_GB)"
    ok=1
  fi

  if [[ -r /proc/meminfo ]]; then
    total_mem_mb=$(($(awk '/MemTotal/ {print $2}' /proc/meminfo) / 1024))
    if [[ "${total_mem_mb}" -ge "${MIN_MEM_MB}" ]]; then
      log_ok "Memory: ${total_mem_mb}MB total (minimum ${MIN_MEM_MB}MB)"
    else
      log_warn "Memory: only ${total_mem_mb}MB total, ${MIN_MEM_MB}MB recommended (override with MIN_MEM_MB)"
    fi
  else
    log_warn "Could not read /proc/meminfo — skipping memory check."
  fi

  cpu_cores="$(nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo 1)"
  if [[ "${cpu_cores}" -ge "${MIN_CPU_CORES}" ]]; then
    log_ok "CPU: ${cpu_cores} core(s) (minimum ${MIN_CPU_CORES})"
  else
    log_warn "CPU: only ${cpu_cores} core(s), ${MIN_CPU_CORES} recommended (override with MIN_CPU_CORES)"
  fi

  return "${ok}"
}

# ── Ports ────────────────────────────────────────────────────────────────

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -Htln "( sport = :${port} )" 2>/dev/null | grep -q . && return 0
    ss -Htun "( sport = :${port} )" 2>/dev/null | grep -q . && return 0
    return 1
  fi
  (exec 3<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null && { exec 3<&- 3>&- 2>/dev/null; return 0; } || return 1
}

# check_ports — validates the ports the resolved DEPLOY_ENV will bind are
# free. If Leinaflow's own containers already exist, a bound port is
# expected (idempotent re-run) rather than a conflict.
#
# demo/production publish nothing to the host by default (see
# compose.demo.yml/compose.prod.yml — frontend/backend only `expose`
# internally on creator-network). Reaching them is an infrastructure
# decision this repo doesn't make: a reverse proxy (e.g. Nginx Proxy
# Manager) either joins creator-network directly (preferred — no host port
# needed) or a host-specific compose override publishes whatever ports it
# needs. Since Leinaflow's own tracked compose files bind nothing in those
# environments, there's nothing here to check.
check_ports() {
  local already_installed=0
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${RESOURCE_PREFIX}-"; then
    already_installed=1
  fi

  local ports=()
  if [[ "${DEPLOY_ENV}" == "development" ]]; then
    ports=("${FRONTEND_PORT:-3000}" "${BACKEND_PORT:-4000}" "${POSTGRES_PORT:-5432}" "${REDIS_PORT:-6379}")
  else
    log_info "No ports published to the host by default in '${DEPLOY_ENV}' — nothing to check here (see comment above)."
    return 0
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
  [[ "${conflict}" -eq 0 ]]
}

# ── Docker installation ──────────────────────────────────────────────────
#
# Shared by install.sh and bootstrap/03-install-docker.sh — one
# implementation of "get Docker onto this box" for both entry points.
# Requires detect_os to have been called first (needs OS_FAMILY/OS_ID).

ensure_docker_installed() {
  if command -v docker >/dev/null 2>&1; then
    log_ok "Docker already installed: $(docker --version)"
    return 0
  fi

  log_info "Docker not found — installing for ${OS_FAMILY} (${OS_ID} ${OS_VERSION})..."
  require_cmd curl

  case "${OS_FAMILY}" in
    debian)
      local codename="${VERSION_CODENAME:-}"
      [[ -n "${codename}" ]] || { log_err "Could not determine distro codename from /etc/os-release."; return 1; }
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
  detect_compose_cmd || { log_err "Docker Compose still unavailable after install."; return 1; }
}

# ── Environment files ────────────────────────────────────────────────────
#
# Shared by install.sh and bootstrap/06-create-env.sh.

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

# ensure_env_files <target_dir> — creates <target_dir>/.env and
# <target_dir>/.env.production from .env.production.example if missing,
# generating JWT_SECRET/SESSION_SECRET when left blank. Both .env (compose
# variable interpolation) and .env.production (what the backend/frontend
# containers actually load via `env_file:` in compose.yml) are
# created from the same template — see docs/Deployment.md's environment
# variables section for why there are two.
ensure_env_files() {
  local target_dir="${1:-${PROJECT_ROOT}}"
  local template="${target_dir}/.env.production.example"
  [[ -f "${template}" ]] || { log_err "Template not found: ${template}"; return 1; }

  local created_any=0
  for target in .env .env.production; do
    local path="${target_dir}/${target}"
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
      log_info "Edit .env / .env.production in ${target_dir} then re-run."
      return 1
    }
  fi
}
