#!/usr/bin/env bash
# 06-create-env.sh — generate secrets, create missing .env files, and
# validate the result. Delegates to the same ensure_env_files/env-check.sh
# install.sh itself uses — no separate implementation.
#
# Sources common.sh from the freshly cloned/pulled INSTALL_DIR (not this
# script's own location) so everything after this point operates on that
# checkout, which matters when INSTALL_DIR differs from where bootstrap.sh
# itself was launched from.

set -o errexit
set -o nounset
set -o pipefail

INSTALL_DIR="${INSTALL_DIR:?INSTALL_DIR must be set (bootstrap.sh sets and exports it)}"

# shellcheck source=/dev/null
source "${INSTALL_DIR}/deployment/lib/common.sh"

validate_deploy_env

log_info "Preparing environment files in ${INSTALL_DIR}..."
ensure_env_files "${INSTALL_DIR}" || exit 1

load_env

"${INSTALL_DIR}/deployment/env-check.sh" --env "${DEPLOY_ENV}" ${ASSUME_YES:+-y}
