#!/usr/bin/env bash
# deploy-demo.sh — the single supported entry point for restoring/updating
# the demo deployment. Meant to be run as just `deploy-demo` (see
# deployment/install-deploy-demo.sh, which symlinks it onto PATH) from any
# directory, unattended, e.g. from cron or a remote trigger.
#
# It wraps deploy.sh's build -> migrate -> start -> health-wait -> smoke-test
# -> summary pipeline with a safer git sync step of its own:
#
#   1. Resolve this script's real location (works through a symlink, e.g.
#      /usr/local/bin/deploy-demo) and cd into the repo root next to it —
#      no manual `cd` required, ever.
#   2. Verify that directory is actually a Leinaflow git checkout with an
#      `origin` remote, not a missing/half-moved/wrong directory.
#   3. git fetch origin.
#   4. Verify the working tree is clean — refuses to touch a checkout with
#      uncommitted local changes rather than guessing what to do with them.
#      (Checked before the pull, not after: pulling over a dirty tree is
#      exactly the situation this check exists to prevent.)
#   5. git pull --ff-only — only ever fast-forwards; never rewrites history,
#      never discards a commit. If the local branch has diverged from
#      origin/main, this fails loudly and this script exits non-zero rather
#      than forcing anything — that divergence needs a human, not a script
#      guessing which side wins.
#   6-11. Delegate to deployment/deploy.sh --env demo --skip-git -y for
#      build/migrate/start/health-wait/smoke-test/summary — deploy.sh
#      already implements all of that with its own documented exit codes.
#      --skip-git is deliberate: this script already did the git sync
#      above; deploy.sh's own git path (`reset --hard origin/main`) is a
#      stronger, more destructive operation than this script's ff-only
#      contract and must not also run here.
#
# Usage: deploy-demo
#
# Exit codes:
#   0      deployed and verified healthy (see deploy.sh's own summary)
#   1-6    forwarded verbatim from deploy.sh — see deploy.sh's header for
#          what each one means (env validation / build / migrate / start /
#          smoke test)
#   10     not run from/near a Leinaflow checkout
#   11     git fetch failed
#   12     working tree has uncommitted local changes
#   13     git pull --ff-only failed (branch has diverged from origin/main)

set -Eeuo pipefail

# Resolves through a symlink (readlink -f), unlike a plain BASH_SOURCE
# dirname — this script is meant to be invoked as /usr/local/bin/deploy-demo,
# a symlink into this checkout, from any cwd.
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

cd "${PROJECT_ROOT}"

log_step "deploy-demo — Leinaflow demo deployment"
log_info "Repository: ${PROJECT_ROOT}"

# ── 1-2. Verify this is actually a Leinaflow checkout ───────────────────────
if [[ ! -d "${PROJECT_ROOT}/.git" ]]; then
  log_err "${PROJECT_ROOT} is not a git checkout — deploy-demo can't fetch/pull here."
  exit 10
fi
if [[ ! -f "${PROJECT_ROOT}/compose.yml" ]] || [[ ! -f "${PROJECT_ROOT}/deployment/deploy.sh" ]]; then
  log_err "${PROJECT_ROOT} doesn't look like a Leinaflow checkout (missing compose.yml/deployment/deploy.sh)."
  exit 10
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  log_err "No 'origin' remote configured in ${PROJECT_ROOT} — cannot fetch/pull."
  exit 10
fi
log_ok "Verified Leinaflow checkout with an 'origin' remote."

# ── 3. Fetch ─────────────────────────────────────────────────────────────
log_info "Fetching origin..."
if ! git fetch origin main --tags --quiet; then
  log_err "git fetch origin failed — check network/credentials."
  exit 11
fi
log_ok "Fetched origin/main ($(git rev-parse --short origin/main))."

# ── 4. Working tree must be clean ───────────────────────────────────────────
DIRTY_STATUS="$(git status --porcelain)"
if [[ -n "${DIRTY_STATUS}" ]]; then
  log_err "Working tree has uncommitted local changes — refusing to pull/deploy over them."
  echo "${DIRTY_STATUS}" | sed 's/^/    /' >&2
  log_err "Commit, stash, or discard these yourself, then re-run deploy-demo. Nothing was touched."
  exit 12
fi
log_ok "Working tree is clean."

# ── 5. Fast-forward only — never a hard reset ───────────────────────────────
BEFORE_COMMIT="$(git rev-parse HEAD)"
log_info "Pulling (fast-forward only)..."
if ! git pull --ff-only origin main; then
  log_err "git pull --ff-only failed — local branch has diverged from origin/main."
  log_err "This needs a human to resolve (rebase/merge/reset), not deploy-demo. Nothing was touched."
  exit 13
fi
AFTER_COMMIT="$(git rev-parse HEAD)"
if [[ "${BEFORE_COMMIT}" == "${AFTER_COMMIT}" ]]; then
  log_ok "Already up to date ($(git rev-parse --short HEAD))."
else
  log_ok "Fast-forwarded ${BEFORE_COMMIT:0:12} -> ${AFTER_COMMIT:0:12}."
fi

# ── 6-11. Build / migrate / start / health-wait / smoke test / summary ─────
# --skip-git: the git sync above already happened; deploy.sh must not also
# try its own (stronger) git handling on top of it.
log_step "Handing off to deploy.sh for build/migrate/start/health/smoke test"
exec "${DEPLOYMENT_DIR}/deploy.sh" --env demo --skip-git -y
