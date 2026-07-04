#!/usr/bin/env bash
# 04-install-git.sh — git-specific readiness, distinct from 02's generic
# package install: verifies git works and configures it for the clone step
# that follows immediately after this one.

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=../lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"

INSTALL_DIR="${INSTALL_DIR:-${PROJECT_ROOT}}"

# 02-install-packages.sh should already have installed git; fall back here
# in case this script is ever run out of order.
if ! command -v git >/dev/null 2>&1; then
  log_info "git not found — installing..."
  sudo_run apt-get update -y
  sudo_run apt-get install -y git
fi
require_cmd git || exit 1
log_ok "git available: $(git --version)"

# Running git as root against a directory it doesn't already consider
# "safe" (e.g. not owned by root) fails with a "detected dubious ownership"
# error — exactly the situation here. Idempotent: --add is a no-op if the
# entry already exists.
mkdir -p "$(dirname "${INSTALL_DIR}")"
git config --global --add safe.directory "${INSTALL_DIR}"
log_ok "Configured git safe.directory for ${INSTALL_DIR}"
