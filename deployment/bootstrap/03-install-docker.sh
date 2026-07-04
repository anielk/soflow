#!/usr/bin/env bash
# 03-install-docker.sh — install Docker + Docker Compose, enable the
# service, and verify. Reuses the exact same install logic as
# deployment/install.sh (ensure_docker_installed/ensure_compose_available in
# lib/common.sh) — nothing here reimplements that.

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=../lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"

detect_os

ensure_docker_installed
ensure_compose_available

# Ubuntu's docker.io/docker-ce packages don't always enable-on-boot by
# default — make sure the service is actually running and will survive a reboot.
sudo_run systemctl enable --now docker

if docker info >/dev/null 2>&1; then
  log_ok "Docker daemon is running."
else
  log_err "Docker was installed but the daemon isn't responding — check 'systemctl status docker'."
  exit 1
fi

log_ok "Docker Compose verified: $(${COMPOSE} version --short 2>/dev/null || ${COMPOSE} version)"
