# Leinaflow — Deployment

This document covers `deployment/` — the scripts that install, deploy,
update, roll back, back up, restore and health-check Leinaflow on a Linux
host. They are the only supported way to deploy the stack outside of local
development, and are designed to become the execution engine the future
Cloudivo Operations Center (COC) drives later (see
[COC integration](#coc-integration) below, and
[docs/COC-Integration.md](COC-Integration.md) for the full architecture —
server discovery, the deploy/rollback/monitoring flows, and why
authentication isn't part of it yet).

No Kubernetes, no Terraform, no cloud provider integration — that's COC's
job. These scripts do one thing: run Leinaflow reliably on a
single Linux box via Docker Compose — and, per
[Architecture.md](deployment/Architecture.md#multi-product-naming), reliably
run *any* Cloudivo product built on this same layering, via `PROJECT_NAME`.

`deploy.sh` is the **Cloudivo Deployment Engine** — the official, git-driven
release mechanism every future Cloudivo product is meant to reuse as-is. See
[The Deployment Engine](#the-deployment-engine-deploysh) below.

## Prerequisites

- A Linux host: Debian/Ubuntu or RHEL/CentOS/Fedora/Rocky Linux/AlmaLinux.
  (`install.sh` detects this and exits with a clear error on anything else.)
- Outbound internet access (to install Docker and pull images).
- A user that can either run Docker directly or has `sudo`.

Nothing else needs to be pre-installed — `install.sh` installs Docker and
the Compose plugin itself if they're missing.

## One-command install

```bash
git clone <repo-url> leinaflow && cd leinaflow
deployment/install.sh --env production
```

That single command: detects your OS, verifies internet connectivity,
installs Docker/Compose if needed, validates ports, creates the backups
folder and media volume, creates `.env` from the template if missing,
validates the environment, builds and starts everything, runs Prisma
generate/migrate/seed, and verifies backend/frontend/database/media are all
healthy before printing a summary.

Re-running `install.sh` on an already-installed host is safe — every step
checks whether it's already done before acting.

## Bootstrap — from a blank Ubuntu server

`install.sh` above assumes Docker, git, and a checkout of this repo already
exist. `deployment/bootstrap.sh` is the step before that: it takes a
**completely clean Ubuntu server** all the way to a running Leinaflow.

```bash
git clone https://github.com/anielk/soflow.git leinaflow && cd leinaflow
sudo ./deployment/bootstrap.sh --env production
```

`bootstrap.sh` only orchestrates — it runs nine numbered scripts under
`deployment/bootstrap/` in order, stopping on the first failure, and the
actual install (step 7) is entirely delegated to `deployment/install.sh`
above. No install logic is duplicated between the two.

| Step | Script | Does |
|---|---|---|
| 1 | `01-system-check.sh` | Root, Ubuntu version, CPU/RAM/disk, internet, ports |
| 2 | `02-install-packages.sh` | `git curl wget openssl ca-certificates jq` |
| 3 | `03-install-docker.sh` | Docker + Compose install, enable service, verify |
| 4 | `04-install-git.sh` | git readiness (`safe.directory` for running as root) |
| 5 | `05-clone-project.sh` | Clone the repo, or `git pull` if already cloned |
| 6 | `06-create-env.sh` | Generate secrets, create missing `.env` files, validate |
| 7 | `07-install-leinaflow.sh` | Runs `deployment/install.sh` |
| 8 | `08-healthcheck.sh` | Runs `deployment/healthcheck.sh` |
| 9 | `09-summary.sh` | Final summary: URLs, DB/Redis/media, Docker + project version |

Configuration (env vars, all optional):

| Variable | Default | Purpose |
|---|---|---|
| `INSTALL_DIR` | wherever `bootstrap.sh` is running from | Where the checkout that gets installed lives. Set to e.g. `/opt/leinaflow` to have bootstrap clone/manage a directory other than the one you launched it from. |
| `PROJECT_REPO_URL` | `https://github.com/anielk/soflow.git` | What `05-clone-project.sh` clones when `INSTALL_DIR` isn't already a checkout |

`--dry-run` prints the resolved config and the ordered step list without
touching the host — use it to sanity-check before running for real:

```bash
sudo ./deployment/bootstrap.sh --env production --dry-run
```

**Future: the one-line curl install.** The eventual goal is
`curl -fsSL https://install.leinaflow.com | sudo bash`. That needs a tiny
separate stub hosted at that URL — nothing this sprint builds, since no such
endpoint exists yet — whose entire job is: ensure `git` is present, `git
clone` this repo into `INSTALL_DIR` (default `/opt/leinaflow`), then `exec`
the real `deployment/bootstrap.sh` from that checkout so the numbered
pipeline above takes over. `bootstrap.sh`'s `INSTALL_DIR`/`PROJECT_REPO_URL`
variables already support being driven this way — only the small hosted
stub itself remains to be written, later, alongside COC.

## The Deployment Engine (`deploy.sh`)

`deploy.sh` is the **Cloudivo Deployment Engine v1** — the official release
mechanism for demo and production (development isn't a `deploy.sh` target;
it's driven directly via `docker compose -f compose.yml -f compose.dev.yml
up`). It supersedes `update.sh` for releases: same rebuild/migrate/restart
core, but git-reset-based (not `pull --ff-only`), with real smoke tests,
per-stage exit codes, a deployed-commit/duration summary, and a persisted
history log `rollback.sh`, `status.sh` and `history.sh` all read.

```bash
deployment/deploy.sh --env production            # interactive
deployment/deploy.sh --env production --yes      # for COC/cron/CI
deployment/deploy.sh --env production --yes --json  # machine-readable result on stdout
```

What it does, strictly in order, aborting on the first failure
(`set -Eeuo pipefail`):

1. **Validate the environment** — runs `env-check.sh`; nothing else happens if this fails.
2. **Fetch latest git, reset to `origin/main`** — if the checkout has uncommitted local changes, deploy.sh explains what it found and **aborts untouched** unless `--force` is given. With `--force`, those changes are `git stash`-ed first (named, timestamped with the deploy reason, never discarded), then `git reset --hard origin/main`. `--skip-git` bypasses this entire step.
3. **Build Docker images** — `docker compose build`.
4. **Run `prisma migrate deploy`** — forward-only; starts postgres/redis first if needed. Never `migrate reset`, never seeds.
5. **Start containers** — `docker compose up -d --wait`.
6. **Wait for backend, frontend and nginx** to report Docker-healthy individually.
7. **Smoke test** — real HTTP requests through the public nginx port: `GET /api/v1/health` and `GET /` both expected to return exactly `200`. `--no-smoke-test` skips this.
8. **Print the deployed commit hash and total deployment duration**, append a line to `deployment/.deploy-history.log`, regenerate `deployment/history.json` from it, and refresh `deployment/server.json`.

`--json` sends every human-readable line to stderr instead and prints one
JSON summary object to stdout as the last line — same exit codes either
way. See [docs/COC-Integration.md](COC-Integration.md#deployment-flow) for
the field list.

Exit codes are part of the contract, not just human-readable text:

| Code | Meaning |
|---|---|
| `0` | Deployed and verified healthy |
| `1` | Argument/environment validation failed — nothing was touched |
| `2` | Git fetch/reset failed, or uncommitted changes were found and `--force` wasn't given |
| `3` | Docker image build failed |
| `4` | Database migration failed |
| `5` | Containers failed to start or reach Docker-healthy in time |
| `6` | Post-deploy smoke test failed (containers up, response was wrong) |

**What it never does**, by construction — not by convention alone:
- Never deletes a Docker volume (no `down -v`/`--volumes`, no `docker volume rm`).
- Never resets the database (only the forward-only `prisma migrate deploy`).
- Never overwrites uploaded media (the media volume is only ever written to by the backend container itself).
- Never silently stashes or discards local changes on the host — it aborts and asks for `--force` first; only then are they stashed (never dropped).

### `status.sh` — read-only snapshot

Reports the current git commit, per-service container state/health, app
version, and the last recorded `deploy.sh` outcome for the environment,
plus a `health` object (version, commit, deployment time, uptime, and
whether backend/frontend/database/storage are actually healthy — not just
"container is running", see
[docs/COC-Integration.md#monitoring-flow](COC-Integration.md#monitoring-flow)).
Always exits `0` once it can reach Docker (it's reporting, not a gate — use
`healthcheck.sh` for PASS/FAIL). `--json` gives a stable machine-readable
shape for COC to poll — the original `env`/`git`/`services`/`last_deploy`
fields never change shape, only gain siblings.

```bash
deployment/status.sh --env production
deployment/status.sh --env production --json
```

### `history.sh` — deployment history table

Renders every attempt recorded in `deployment/.deploy-history.log` (written
by `deploy.sh` and `rollback.sh`) as a table: timestamp, environment,
commit, branch, duration and result (plus, for a rollback, what it rolled
back from), newest first. Read-only, always exits `0`. `--json` gives the
same data as an array — the same shape `deployment/history.json` is
regenerated in on every deploy/rollback attempt, so a caller can read
either.

```bash
deployment/history.sh                    # every environment
deployment/history.sh --env production
deployment/history.sh --json
```

### `rollback.sh` — code rollback (v1: documented flow, code path implemented)

Two different things can go wrong with a deploy, and they roll back
differently — see [Rollback.md](deployment/Rollback.md) for the full
narrative:

- **Bad code** (the common case): `rollback.sh` implements this end-to-end —
  resolve a target commit (`--to <ref>`, or by default the most recent
  commit `deploy.sh` recorded as a `SUCCESS` for this env, other than the
  current one). If the checkout has uncommitted local changes, it explains
  what it found and aborts unless `--force` is given (same contract as
  `deploy.sh` — see above); with `--force` those changes are stashed first.
  Then `git checkout --detach` to the target, rebuild, restart, and verify
  with `healthcheck.sh`. No data is touched.
- **Bad data** (a migration/seed needs undoing): `rollback.sh` does **not**
  implement this itself — `--data-rollback` prints the flow and exits
  without changing anything, deferring to the already-destructive
  `restore.sh` (below), which owns that path.

```bash
deployment/rollback.sh --env production                 # to the last known-good deploy
deployment/rollback.sh --env production --to <commit-ish>
deployment/rollback.sh --data-rollback                   # print the data-rollback flow, exit
deployment/rollback.sh --env production --yes --json     # machine-readable result on stdout
```

After a code rollback, the host's checkout is a detached HEAD behind
`origin/main` — the next `deploy.sh` run resets it back to `origin/main`'s
tip, so land and deploy the actual fix before running `deploy.sh` again.

Like `deploy.sh`, `--json` moves human output to stderr and prints one JSON
summary object to stdout (`result`: `success`/`noop`/`cancelled`/`failed`)
— see
[docs/COC-Integration.md#rollback-flow](COC-Integration.md#rollback-flow).
Both a successful rollback and a failed one append to
`deployment/.deploy-history.log`/`deployment/history.json`, so a failed
rollback attempt is visible in history too, not just successful ones.

## Scripts reference

All scripts live in `deployment/` and share two flags:

| Flag | Meaning |
|---|---|
| `--env <env>` | `development`, `demo`, or `production` (default `production`; `deploy.sh`/`rollback.sh` only accept `demo`/`production`) |
| `-y`, `--yes` | Non-interactive: auto-accept every prompt |
| `--json` | `deploy.sh`/`rollback.sh`/`status.sh`/`history.sh` only: human output moves to stderr, one JSON object (or array, for `history.sh`) prints to stdout. Same exit codes either way. See [docs/COC-Integration.md](COC-Integration.md). |

| Script | Purpose |
|---|---|
| `bootstrap.sh` | Full pipeline from a **blank Ubuntu server** to a running Leinaflow — see [Bootstrap](#bootstrap--from-a-blank-ubuntu-server) above. `--dry-run` supported. |
| `install.sh` | Full install on a clean or partially-set-up host. Also: `--seed` / `--no-seed` to override the default seed behavior. Writes `deployment/server.json` on completion. |
| `deploy.sh` | **The Cloudivo Deployment Engine.** git reset → build → migrate → start → health → smoke test, for demo/production releases. `--force` required if the checkout has uncommitted changes. See [above](#the-deployment-engine-deploysh). |
| `status.sh` | Read-only snapshot: commit, per-service state/health, version, real health checks, last deploy. `--json` for machine consumption. |
| `history.sh` | Read-only deployment history table from `.deploy-history.log`: timestamp, environment, commit, branch, duration, result, rollback info. `--json` for machine consumption (same shape `deployment/history.json` is regenerated in). |
| `rollback.sh` | Code rollback to a prior successfully-deployed commit. `--to <ref>`, `--data-rollback` to print (not run) the data-rollback flow. `--force` required if the checkout has uncommitted changes. |
| `update.sh` | The original release path: `git pull` (if applicable) → rebuild → restart → migrate → health check. Still works, still supports `development`; prefer `deploy.sh` for demo/production releases going forward. |
| `backup.sh` | Snapshot database, media, `.env`, and compose/nginx config into `backups/YYYY-MM-DD-HHMM/`. Prints the backup path. |
| `restore.sh` | Interactively restore a backup. `--backup <dir>` to pick one non-interactively, `--dry-run` to preview without touching anything. |
| `healthcheck.sh` | PASS/FAIL check of Docker, all containers, Postgres, Redis, backend, frontend, disk, and media storage. Exit code 0/1. |
| `uninstall.sh` | Stop and remove containers. `--remove-volumes` to also delete data (typed confirmation required), `--delete-backups` to also wipe backups. `--dry-run` supported. |
| `env-check.sh` | Standalone host/environment audit — Docker/Compose versions, disk/memory/CPU, permissions, required env vars, media path. Also run automatically as part of `install.sh` and as `deploy.sh`'s first step. |

Shared logic (logging, OS/compose detection, `.env` loading, confirmation
prompts, health polling) lives in `deployment/lib/common.sh`, sourced by
every script above — it's a library, not meant to be run directly.

## `DEPLOY_ENV` semantics

| Environment | Compose files | Notes |
|---|---|---|
| `development` | `compose.yml` + `compose.dev.yml` | Hot-reload, bind mounts, ports published directly (`FRONTEND_PORT`/`BACKEND_PORT`/`POSTGRES_PORT`/`REDIS_PORT` from `.env`). Seeded by default. |
| `demo` | `compose.yml` + `compose.demo.yml` | Built images, nginx in front, only `80`/`443` exposed. Seeded by default. |
| `production` | `compose.yml` + `compose.prod.yml` | Functionally identical to demo (see [docs/deployment/Architecture.md](deployment/Architecture.md)), but **seeding is skipped by default** (the seed creates known demo credentials — pass `--seed` to `install.sh` to force it). |

**Default resolution when `--env` isn't given**, in order: an explicit
`--env` flag always wins; then `DEPLOY_ENV` if already set in the calling
shell's environment; then this host's own `deployment/server.json`
(`environment` field — what it was actually installed/last deployed as);
`production` only as a last resort, for a host that hasn't been installed
yet. This matters most for `status.sh`, which is routinely run with no
flags — without the `server.json` step it would silently report
`production` on a demo host that simply wasn't told otherwise, while
`history.sh` (which reads recorded facts, not a flag/default) correctly
showed `demo` for the exact same deploy. `deploy.sh`/`rollback.sh` always
require an explicit `--env demo|production` for the action itself, so
their own reports/history entries were never affected by this — only a
bare `status.sh` invocation was.

See [docs/deployment/](deployment/) for the full per-environment guides (Development, Demo, Production, Rollback, Architecture).

## Environment variables

Read from the project-root `.env` (created by `install.sh` from
`.env.production.example` if missing — see `backend/src/config/env.validation.ts`
for the authoritative list of what the backend itself requires).

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Yes | Backend auth token signing |
| `DATABASE_URL` | Yes | Postgres connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Yes | Postgres container credentials |
| `MEDIA_STORAGE_DRIVER` | No (default `local`) | Storage backend for the media library |
| `MEDIA_STORAGE_PATH` | No (default `/data/media`) | Mount point inside the backend container |
| `MEDIA_MAX_FILE_SIZE_MB` | No (default `2048`) | Max upload size |
| `NEXT_PUBLIC_API_URL` | No | Frontend → backend base URL |

Deployment-script-specific variables (all optional, sensible defaults):

| Variable | Default | Purpose |
|---|---|---|
| `DEPLOY_ENV` | `production` | See table above |
| `ASSUME_YES` | `0` | Same effect as passing `-y`/`--yes` |
| `BACKUP_DIR` | `<project root>/backups` | Where `backup.sh`/`restore.sh` read and write |
| `MIN_DISK_GB` | `5` | `env-check.sh`/`healthcheck.sh` disk floor |
| `MIN_MEM_MB` | `2048` | `env-check.sh` memory floor (warning only) |
| `MIN_CPU_CORES` | `2` | `env-check.sh` CPU floor (warning only) |
| `NO_COLOR` | unset | Set to disable colored output |
| `HEALTH_TIMEOUT` | `180` | `deploy.sh`/`rollback.sh`: seconds to wait for containers to report Docker-healthy |

## Directory layout

```
deployment/
  lib/common.sh   # shared helpers — sourced, not executed
  bootstrap.sh    # orchestrator: blank Ubuntu server -> running Leinaflow
  bootstrap/
    01-system-check.sh
    02-install-packages.sh
    03-install-docker.sh
    04-install-git.sh
    05-clone-project.sh
    06-create-env.sh
    07-install-leinaflow.sh
    08-healthcheck.sh
    09-summary.sh
  install.sh
  deploy.sh       # the Cloudivo Deployment Engine — see above
  status.sh
  history.sh
  rollback.sh
  update.sh
  backup.sh
  restore.sh
  healthcheck.sh
  uninstall.sh
  env-check.sh
  .deploy-history.log   # created by deploy.sh/rollback.sh — gitignored, host-local
  history.json          # regenerated from .deploy-history.log — gitignored, host-local
  server.json           # created by install.sh, refreshed by deploy.sh/rollback.sh — gitignored, host-local
backups/
  2026-07-02-1500/
    db.sql
    media.tar.gz
    env/{.env,.env.production}
    config/{compose.yml,compose.dev.yml,compose.demo.yml,compose.prod.yml,docker/,nginx/}
    manifest.txt
```

## Typical workflows

**Fresh production server:**
```bash
deployment/install.sh --env production --yes
```

**Deploy a new release:**
```bash
deployment/backup.sh --env production   # always back up first
deployment/deploy.sh --env production
```

**Check what's running, without changing anything:**
```bash
deployment/status.sh --env production
```

**Roll back a bad deploy (code only — see Rollback.md for data rollback):**
```bash
deployment/rollback.sh --env production
```

**Disaster recovery:**
```bash
deployment/restore.sh --env production --dry-run   # see what would happen
deployment/restore.sh --env production              # then do it for real
```

**Scheduled health monitoring (cron):**
```bash
*/5 * * * * /opt/leinaflow/deployment/healthcheck.sh --env production >> /var/log/leinaflow-health.log 2>&1
```

## Troubleshooting

- **Port already in use during install**: `install.sh` distinguishes "in use
  by Leinaflow's own containers" (fine, expected on a re-run) from "in use by
  something else" (fails with the specific port). Free the port or change it
  in `.env` (`FRONTEND_PORT`/`BACKEND_PORT`/`POSTGRES_PORT`/`REDIS_PORT`, dev
  only — demo/production only bind 80/443).
- **Migration fails on deploy/install/update**: check `dc logs backend` (or
  `docker compose logs backend`), then re-run `deployment/deploy.sh`,
  `deployment/install.sh` or `deployment/update.sh` — migrations are safe to
  retry.
- **`healthcheck.sh` reports a container not running**: `docker compose ps`
  to see its state, `docker compose logs <service>` for why it exited.
- **Docker install step fails**: `install.sh` only supports Debian/Ubuntu and
  RHEL-family distros via Docker's official package repositories; on
  anything else, install Docker manually first, then re-run `install.sh` —
  it will detect Docker is present and skip straight past that step.
- **`deploy.sh` fails and you're not sure why**: the failing stage is named
  in the final `[FAIL]` line and encoded in the exit code (see
  [above](#the-deployment-engine-deploysh)) — `2` means look at git state,
  `4` means look at `dc logs backend` for the migration, `6` means the
  containers are up but `curl` against nginx got the wrong response.
  `deployment/status.sh --env <env>` shows what's actually running right now.

## COC integration

Every script here is designed to be driven non-interactively:

- `-y`/`--yes` (or `ASSUME_YES=1`) replaces every interactive prompt with
  automatic acceptance — no script blocks waiting for stdin when this is set.
- Scripts that aren't run with `-y`/`--yes` and aren't attached to a TTY
  **fail fast** with a clear error rather than hanging, so a misconfigured
  automated run never gets stuck.
- Exit codes are the automation contract: `0` = success, non-zero = failure.
  `healthcheck.sh` and `env-check.sh` are pure PASS/FAIL gates for this
  reason; `deploy.sh` and `rollback.sh` go further and use distinct
  non-zero codes per failing stage (see
  [above](#the-deployment-engine-deploysh)) so a caller can distinguish "git
  problem" from "migration problem" from "smoke test problem" without
  parsing log text.
- `backup.sh` prints the created backup's path as its last line of stdout,
  so a caller can capture it directly (`BACKUP=$(deployment/backup.sh --yes | tail -1)`).
- `restore.sh` and `uninstall.sh` support `--dry-run` to preview a destructive
  action's exact effects before an automated system commits to it.
- `bootstrap.sh`'s nine steps are separate scripts specifically so an
  automated caller can observe/retry a single named step instead of only
  ever getting one pass/fail signal for the whole pipeline.
- `deploy.sh` timestamps every line of output and appends a
  machine-parseable record (timestamp, env, commit, duration, result) to
  `deployment/.deploy-history.log` on every attempt — `rollback.sh` appends
  the same shape for a rollback — so a caller doesn't have to scrape stdout
  to know what was last deployed, how long it took, and whether it succeeded.
- `history.sh --json` renders that entire log as a stable array (same
  fields, newest first) — this is the shape COC's UI should read to show
  deployment history, rather than parsing `.deploy-history.log` itself.
  `deployment/history.json` is the same shape, regenerated on disk on
  every attempt, for a caller that would rather read a file than spawn a
  script.
- `status.sh --json` gives a stable, scriptable snapshot of what's currently
  running (commit, per-service state/health, version, real backend/
  frontend/database/storage health, last deploy) — this is the shape a
  dashboard or polling loop should consume, not `healthcheck.sh`'s
  human-readable PASS/FAIL lines.
- `deploy.sh --json` and `rollback.sh --json` move all human output to
  stderr and print exactly one JSON result object to stdout as the last
  line — same schema envelope (`schema_version`/`script`/
  `deployment_engine`/`environment`/`version`/`commit`/.../`result`) as
  each other, so a caller parses both the same way.
- `deployment/server.json` (created by `install.sh`, refreshed by
  `deploy.sh`/`rollback.sh`) is this host's stable identity — a `serverId`
  generated once and never changed, plus environment/version/hostname kept
  current — for COC to discover and recognize a server by.
- `deploy.sh` and `rollback.sh` both refuse to touch a checkout with
  uncommitted local changes unless `--force` is passed — an automated
  caller must decide and pass that flag explicitly rather than having
  changes silently stashed on its behalf.

**Where COC calls in.** On a brand-new server, its provisioning step
would run `sudo deployment/bootstrap.sh --env production --yes` (after the
future curl-stub hand-off described above places a checkout at
`INSTALL_DIR`). On an existing server, it drives `deploy.sh`/`status.sh`/
`history.sh`/`rollback.sh`/`backup.sh`/`restore.sh`/`healthcheck.sh`
directly, exactly as documented above — `deploy.sh` in particular is meant
to be COC's one entry point for "ship this commit," with everything else
here supporting it.
COC itself is not implemented here — this section only documents the
contract these scripts already honor so it can call them directly later.
See [docs/COC-Integration.md](COC-Integration.md) for the full picture
(server discovery, each flow's exact JSON shape, and why authentication is
deliberately not part of this yet) rather than duplicating it here.
