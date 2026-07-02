#!/usr/bin/env bash
# update.sh — pull latest code, rebuild, migrate, and verify health.
#
# Usage: deployment/update.sh [--env development|demo|production] [-y|--yes]

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

parse_common_flags "$@"
validate_deploy_env
load_env
detect_compose_cmd

log_step "Leinaflow update (env: ${DEPLOY_ENV})"

log_step "1. Pulling latest code"
if git -C "${PROJECT_ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
   && git -C "${PROJECT_ROOT}" remote get-url origin >/dev/null 2>&1; then
  git -C "${PROJECT_ROOT}" pull --ff-only
  log_ok "Repository updated."
else
  log_warn "Not a git repository with an 'origin' remote — skipping git pull. Deploying whatever is currently on disk."
fi

log_step "2. Rebuilding containers"
dc build

log_step "3. Restarting services"
dc up -d

log_step "4. Running database migrations"
dc exec -T backend npm run prisma:migrate:deploy

log_info "Waiting for backend/frontend to finish booting..."
wait_for_http_ok backend "http://localhost:4000/v1/health" 90 || log_warn "Backend did not respond within 90s — see the health check below."
wait_for_http_ok frontend "http://localhost:3000" 90 || log_warn "Frontend did not respond within 90s — see the health check below."

log_step "5. Verifying health"
"${DEPLOYMENT_DIR}/healthcheck.sh" --env "${DEPLOY_ENV}"

log_ok "Update complete."
