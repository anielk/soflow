#!/usr/bin/env bash
# bootstrap.sh — take a completely clean Ubuntu server to a fully
# operational Leinaflow install with one command:
#
#   sudo ./bootstrap.sh [--env development|demo|production] [-y|--yes] [--dry-run]
#
# This script only orchestrates. Every step's actual logic lives in its own
# numbered script under deployment/bootstrap/, and installing Leinaflow
# itself is entirely delegated to the existing deployment/install.sh (see
# bootstrap/07-install-leinaflow.sh) — nothing here duplicates that logic.
#
# Configuration (env vars, all optional):
#   INSTALL_DIR       Where the Leinaflow checkout that gets installed lives.
#                      Defaults to wherever this script is already running
#                      from (the plain `sudo ./bootstrap.sh` case). Set it to
#                      something else, e.g. /opt/leinaflow, to have bootstrap
#                      clone/manage a separate directory instead.
#   PROJECT_REPO_URL  Git URL to clone when INSTALL_DIR isn't already a
#                      checkout. Defaults to the project's GitHub repo.
#
# See docs/Deployment.md's "Bootstrap" section for the full step table and
# where the Cloudivo Operations Center (COC) will later call this script.

set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

parse_common_flags "$@"
set -- "${REMAINING_ARGS[@]}"

DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) log_err "Unknown argument: $1"; exit 1 ;;
  esac
done

validate_deploy_env

INSTALL_DIR="${INSTALL_DIR:-${PROJECT_ROOT}}"
PROJECT_REPO_URL="${PROJECT_REPO_URL:-https://github.com/anielk/soflow.git}"
export INSTALL_DIR PROJECT_REPO_URL

STEPS=(
  "01-system-check.sh:Verify OS, root, resources, internet, ports"
  "02-install-packages.sh:Install git, curl, wget, openssl, ca-certificates, jq"
  "03-install-docker.sh:Install and enable Docker + Docker Compose"
  "04-install-git.sh:Verify git and prepare it for the clone step"
  "05-clone-project.sh:Clone the project, or git pull if already cloned"
  "06-create-env.sh:Generate secrets, create missing .env files, validate"
  "07-install-leinaflow.sh:Run deployment/install.sh (build, migrate, seed, start)"
  "08-healthcheck.sh:Confirm the running stack is healthy"
  "09-summary.sh:Print the final summary"
)

if [[ "${DRY_RUN}" -eq 1 ]]; then
  log_step "Leinaflow bootstrap — dry run (env: ${DEPLOY_ENV})"
  echo "INSTALL_DIR:      ${INSTALL_DIR}"
  echo "PROJECT_REPO_URL: ${PROJECT_REPO_URL}"
  case "${DEPLOY_ENV}" in
    development) echo "Compose files:    -f ${INSTALL_DIR}/compose.yml -f ${INSTALL_DIR}/compose.dev.yml" ;;
    demo)        echo "Compose files:    -f ${INSTALL_DIR}/compose.yml -f ${INSTALL_DIR}/compose.demo.yml" ;;
    production)  echo "Compose files:    -f ${INSTALL_DIR}/compose.yml -f ${INSTALL_DIR}/compose.prod.yml" ;;
  esac
  echo
  echo "Steps that would run, in order:"
  for step in "${STEPS[@]}"; do
    printf '  %-24s %s\n' "${step%%:*}" "${step#*:}"
  done
  echo
  echo "Nothing was changed — this was a dry run."
  exit 0
fi

log_step "Leinaflow bootstrap (env: ${DEPLOY_ENV}, install dir: ${INSTALL_DIR})"

for step in "${STEPS[@]}"; do
  script="${step%%:*}"
  description="${step#*:}"
  log_step "==> ${script} — ${description}"
  bash "${SCRIPT_DIR}/bootstrap/${script}"
done

log_ok "Bootstrap complete."
