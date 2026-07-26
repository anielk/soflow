#!/usr/bin/env bash
# 08-healthcheck.sh — re-confirm the stack is healthy from bootstrap's own
# numbered checklist. install.sh (the previous step) already verifies
# health internally as its own last step; this gives bootstrap a distinctly
# named, independently retriable step of its own — useful for the Cloudivo
# Operations Center (COC), which will want to know "did step 8 pass"
# separately from "did step 7 pass".

set -o errexit
set -o nounset
set -o pipefail

INSTALL_DIR="${INSTALL_DIR:?INSTALL_DIR must be set (bootstrap.sh sets and exports it)}"
DEPLOY_ENV="${DEPLOY_ENV:-production}"

"${INSTALL_DIR}/deployment/healthcheck.sh" --env "${DEPLOY_ENV}"
