#!/usr/bin/env bash
# deploy-prod.sh — the single supported entry point for restoring/updating
# the production deployment. Meant to be run as just `deploy-prod`
# (symlinked onto PATH, e.g. /usr/local/bin/deploy-prod) from any directory,
# unattended. Identical contract to deploy-demo.sh — see that script's
# header — the only difference is --env production below.
#
# Usage: deploy-prod
#
# Exit codes:
#   0      deployed and verified healthy (see deploy.sh's own summary)
#   1-6    forwarded verbatim from deploy.sh — see deploy.sh's header for
#          what each one means (env validation / build / migrate / start /
#          smoke test)
#   10-13  git sync failed — see lib/common.sh#ff_only_git_sync

set -Eeuo pipefail

# Resolves through a symlink (readlink -f), unlike a plain BASH_SOURCE
# dirname — this script is meant to be invoked as /usr/local/bin/deploy-prod,
# a symlink into this checkout, from any cwd.
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

cd "${PROJECT_ROOT}"

log_step "deploy-prod — Leinaflow production deployment"
log_info "Repository: ${PROJECT_ROOT}"

ff_only_git_sync || exit $?

# --skip-git: the git sync above already happened; deploy.sh must not also
# try its own (stronger) git handling on top of it.
log_step "Handing off to deploy.sh for build/migrate/start/health/smoke test"
exec "${DEPLOYMENT_DIR}/deploy.sh" --env production --skip-git -y
