#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "${BACKUP_DIR}"

cd "${PROJECT_ROOT}"

if [[ -f ".env" ]]; then
  set -o allexport
  source .env
  set +o allexport
fi

: "${POSTGRES_USER:=creator_admin}"
: "${POSTGRES_DB:=creator_platform}"

docker compose exec -T postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "${BACKUP_DIR}/db_${TIMESTAMP}.sql"
echo "Database backup created at ${BACKUP_DIR}/db_${TIMESTAMP}.sql"
