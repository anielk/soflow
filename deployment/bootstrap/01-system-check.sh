#!/usr/bin/env bash
# 01-system-check.sh — verify this is a fit, root-accessible Ubuntu host
# before anything else runs. Part of deployment/bootstrap.sh's pipeline; not
# meant to be run standalone (though it's harmless to).

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=../lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"

validate_deploy_env

# ── Root privileges ────────────────────────────────────────────────────────
# The only place bootstrap enforces this — every later step assumes it.
if [[ "${EUID}" -ne 0 ]]; then
  log_err "bootstrap.sh must be run as root: sudo ./bootstrap.sh"
  exit 1
fi
log_ok "Running as root."

# ── Ubuntu specifically ────────────────────────────────────────────────────
# install.sh remains the generic Debian/RHEL entry point; bootstrap.sh
# targets Ubuntu only, per this pipeline's stated goal.
detect_os
if [[ "${OS_ID}" != "ubuntu" ]]; then
  log_err "bootstrap.sh only supports Ubuntu (detected: ${OS_ID} ${OS_VERSION}). Use deployment/install.sh directly on other distributions."
  exit 1
fi
log_ok "Ubuntu ${OS_VERSION} detected."

# ── Resources ────────────────────────────────────────────────────────────
FAILED=0
check_resources || FAILED=1

# ── Internet ─────────────────────────────────────────────────────────────
if has_internet; then
  log_ok "Internet connectivity confirmed."
else
  log_err "No internet connectivity — required to install packages and pull images."
  FAILED=1
fi

# ── Ports ────────────────────────────────────────────────────────────────
load_env
check_ports || FAILED=1

if [[ "${FAILED}" -eq 0 ]]; then
  log_ok "System check passed."
else
  log_err "System check failed — see above."
  exit 1
fi
