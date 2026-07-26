#!/usr/bin/env bash
# history.sh — render deployment/.deploy-history.log as a readable table.
#
# deploy.sh and rollback.sh each append one tab-separated line per attempt
# (timestamp, environment, commit, duration, status, branch, from_commit —
# see lib/common.sh's "Deployment history" section) to this file; this
# script is the read-only view over it, via the same history_line_to_json
# helper deploy.sh/rollback.sh use to keep deployment/history.json (the
# machine-readable form of the same data, regenerated on every attempt —
# see docs/COC-Integration.md#monitoring-flow) in sync. --json here always
# reflects the current log; reading deployment/history.json directly gets
# you the same shape without spawning this script.
#
# Usage:
#   deployment/history.sh
#   deployment/history.sh --env production
#   deployment/history.sh --json
#
# Exit codes: 0 always — a missing or empty history file is reported, not
# treated as a failure.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

FILTER_ENV=""
JSON_OUTPUT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) FILTER_ENV="$2"; shift 2 ;;
    --env=*) FILTER_ENV="${1#--env=}"; shift ;;
    --json) JSON_OUTPUT=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -n "${FILTER_ENV}" ]]; then
  case "${FILTER_ENV}" in
    development|demo|production) ;;
    *) log_err "Invalid --env '${FILTER_ENV}' — must be one of: development, demo, production"; exit 1 ;;
  esac
fi

HISTORY_FILE="${DEPLOYMENT_DIR}/.deploy-history.log"

if [[ ! -s "${HISTORY_FILE}" ]]; then
  if [[ "${JSON_OUTPUT}" -eq 1 ]]; then
    echo "[]"
  else
    echo "No deployment history recorded yet (${HISTORY_FILE} doesn't exist)."
  fi
  exit 0
fi

# Filter by env if given, newest attempt first.
ENTRIES="$(awk -F'\t' -v env="${FILTER_ENV}" 'env == "" || $2 == env' "${HISTORY_FILE}" | tac)"

if [[ -z "${ENTRIES}" ]]; then
  if [[ "${JSON_OUTPUT}" -eq 1 ]]; then
    echo "[]"
  else
    echo "No deployment history recorded for env '${FILTER_ENV}'."
  fi
  exit 0
fi

if [[ "${JSON_OUTPUT}" -eq 1 ]]; then
  entries_json=""
  while IFS= read -r line; do
    [[ -z "${line}" ]] && continue
    [[ -n "${entries_json}" ]] && entries_json+=","
    entries_json+="$(history_line_to_json "${line}")"
  done <<< "${ENTRIES}"
  printf '[%s]\n' "${entries_json}"
  exit 0
fi

log_step "Leinaflow deployment history${FILTER_ENV:+ — env: ${FILTER_ENV}}"
printf '  %-25s  %-11s  %-13s  %-9s  %-11s  %s\n' "TIMESTAMP" "ENVIRONMENT" "COMMIT" "BRANCH" "DURATION" "RESULT"
while IFS=$'\t' read -r ts env commit duration result branch from_commit; do
  printf '  %-25s  %-11s  %-13s  %-9s  %-11s  %s\n' "${ts}" "${env}" "${commit:0:12}" "${branch:-unknown}" "$(format_duration "${duration}")" \
    "${result}$([[ -n "${from_commit}" ]] && echo " (from ${from_commit:0:12})")"
done <<< "${ENTRIES}"
