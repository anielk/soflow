#!/usr/bin/env bash
# 07-install-leinaflow.sh — pure delegation to the existing
# deployment/install.sh. All install logic (build, migrate, seed, start,
# verify) lives there — this step does not duplicate any of it.

set -o errexit
set -o nounset
set -o pipefail

INSTALL_DIR="${INSTALL_DIR:?INSTALL_DIR must be set (bootstrap.sh sets and exports it)}"
DEPLOY_ENV="${DEPLOY_ENV:-production}"

"${INSTALL_DIR}/deployment/install.sh" --env "${DEPLOY_ENV}" ${ASSUME_YES:+-y}
