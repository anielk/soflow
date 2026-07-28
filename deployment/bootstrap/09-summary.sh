#!/usr/bin/env bash
# 09-summary.sh — print the final "you're done" summary.

set -o errexit
set -o nounset
set -o pipefail

INSTALL_DIR="${INSTALL_DIR:?INSTALL_DIR must be set (bootstrap.sh sets and exports it)}"

# shellcheck source=/dev/null
source "${INSTALL_DIR}/deployment/lib/common.sh"

validate_deploy_env
load_env
detect_compose_cmd || true

if [[ "${DEPLOY_ENV}" == "development" ]]; then
  frontend_url="http://localhost:${FRONTEND_PORT:-3000}"
  backend_url="http://localhost:${BACKEND_PORT:-4000}/v1"
else
  # demo/production don't publish frontend/backend ports to the host by
  # default — whatever reverse proxy this host uses either joins
  # creator-network directly (preferred) or a host-specific compose
  # override publishes whatever ports it needs. That choice lives outside
  # this repo, so there's no single URL to print here.
  frontend_url="frontend:3000 on creator-network (not published to the host by default)"
  backend_url="backend:4000/v1 on creator-network (not published to the host by default)"
fi

docker_version="$(docker --version 2>/dev/null || echo "unknown")"

project_version="unknown"
if [[ -f "${INSTALL_DIR}/backend/package.json" ]] && command -v jq >/dev/null 2>&1; then
  project_version="$(jq -r '.version' "${INSTALL_DIR}/backend/package.json" 2>/dev/null || echo "unknown")"
fi
git_commit="$(git -C "${INSTALL_DIR}" rev-parse --short HEAD 2>/dev/null || echo "unknown")"

log_step "Leinaflow is ready (env: ${DEPLOY_ENV})"
cat <<SUMMARY
  Frontend:       ${frontend_url}
  Backend API:    ${backend_url}
  Database:       postgres://${POSTGRES_USER:-creator_admin}@postgres:5432/${POSTGRES_DB:-creator_platform}
  Redis:          redis://redis:6379
  Media storage:  ${MEDIA_STORAGE_PATH:-/data/media} (volume: ${RESOURCE_PREFIX}-media-storage)
  Docker:         ${docker_version}
  Project:        v${project_version} (${git_commit})
  Install dir:    ${INSTALL_DIR}

Next steps:
  - ${INSTALL_DIR}/deployment/healthcheck.sh --env ${DEPLOY_ENV}   # re-check health any time
  - ${INSTALL_DIR}/deployment/backup.sh --env ${DEPLOY_ENV}        # take a backup
  - ${INSTALL_DIR}/docs/Deployment.md                              # full reference
SUMMARY
