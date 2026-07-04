#!/usr/bin/env bash
# 02-install-packages.sh — install the baseline packages Leinaflow's other
# bootstrap/deployment scripts assume exist. Idempotent: apt-get install is
# a no-op for packages that are already present.

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=../lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"

PACKAGES=(git curl wget openssl ca-certificates jq)

MISSING=()
for pkg in "${PACKAGES[@]}"; do
  dpkg -s "${pkg}" >/dev/null 2>&1 || MISSING+=("${pkg}")
done

if [[ "${#MISSING[@]}" -eq 0 ]]; then
  log_ok "All required packages already installed: ${PACKAGES[*]}"
  exit 0
fi

log_info "Installing missing packages: ${MISSING[*]}"
sudo_run apt-get update -y
sudo_run apt-get install -y "${MISSING[@]}"

for pkg in "${MISSING[@]}"; do
  dpkg -s "${pkg}" >/dev/null 2>&1 || { log_err "Failed to install: ${pkg}"; exit 1; }
done
log_ok "Packages installed: ${MISSING[*]}"
