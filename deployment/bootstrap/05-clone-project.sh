#!/usr/bin/env bash
# 05-clone-project.sh — clone the Leinaflow repo into INSTALL_DIR, or
# `git pull` it if it's already there.

set -o errexit
set -o nounset
set -o pipefail

# shellcheck source=../lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"

INSTALL_DIR="${INSTALL_DIR:-${PROJECT_ROOT}}"
PROJECT_REPO_URL="${PROJECT_REPO_URL:-https://github.com/anielk/soflow.git}"

if [[ -d "${INSTALL_DIR}/.git" ]]; then
  log_info "Already cloned at ${INSTALL_DIR} — pulling latest."
  git -C "${INSTALL_DIR}" pull --ff-only
  log_ok "Repository up to date at ${INSTALL_DIR}."
elif [[ ! -e "${INSTALL_DIR}" ]] || [[ -z "$(ls -A "${INSTALL_DIR}" 2>/dev/null)" ]]; then
  log_info "Cloning ${PROJECT_REPO_URL} into ${INSTALL_DIR}..."
  git clone "${PROJECT_REPO_URL}" "${INSTALL_DIR}"
  log_ok "Cloned into ${INSTALL_DIR}."
else
  log_err "${INSTALL_DIR} already exists, is non-empty, and isn't a git repository — refusing to overwrite it. Remove it or set INSTALL_DIR to an empty/new path."
  exit 1
fi
