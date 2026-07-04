# Leinaflow — Deployment

This document covers `deployment/` — the scripts that install, update, back
up, restore and health-check Leinaflow on a Linux host. They are the only
supported way to deploy the stack outside of local development, and are
designed to become the execution engine CPOS drives later (see
[CPOS integration](#cpos-integration) below).

No Kubernetes, no Terraform, no cloud provider integration — that's CPOS's
job. These scripts do one thing: run Leinaflow reliably on a single Linux
box via Docker Compose.

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
stub itself remains to be written, later, alongside CPOS.

## Scripts reference

All scripts live in `deployment/` and share two flags:

| Flag | Meaning |
|---|---|
| `--env <env>` | `development`, `demo`, or `production` (default `production`) |
| `-y`, `--yes` | Non-interactive: auto-accept every prompt |

| Script | Purpose |
|---|---|
| `bootstrap.sh` | Full pipeline from a **blank Ubuntu server** to a running Leinaflow — see [Bootstrap](#bootstrap--from-a-blank-ubuntu-server) above. `--dry-run` supported. |
| `install.sh` | Full install on a clean or partially-set-up host. Also: `--seed` / `--no-seed` to override the default seed behavior. |
| `update.sh` | `git pull` (if applicable) → rebuild → restart → migrate → health check. |
| `backup.sh` | Snapshot database, media, `.env`, and compose/nginx config into `backups/YYYY-MM-DD-HHMM/`. Prints the backup path. |
| `restore.sh` | Interactively restore a backup. `--backup <dir>` to pick one non-interactively, `--dry-run` to preview without touching anything. |
| `healthcheck.sh` | PASS/FAIL check of Docker, all containers, Postgres, Redis, backend, frontend, disk, and media storage. Exit code 0/1. |
| `uninstall.sh` | Stop and remove containers. `--remove-volumes` to also delete data (typed confirmation required), `--delete-backups` to also wipe backups. `--dry-run` supported. |
| `env-check.sh` | Standalone host/environment audit — Docker/Compose versions, disk/memory/CPU, permissions, required env vars, media path. Also run automatically as part of `install.sh`. |

Shared logic (logging, OS/compose detection, `.env` loading, confirmation
prompts) lives in `deployment/lib/common.sh`, sourced by every script above
— it's a library, not meant to be run directly.

## `DEPLOY_ENV` semantics

| Environment | Compose files | Notes |
|---|---|---|
| `development` | `docker-compose.yml` | Hot-reload, ports published directly (`FRONTEND_PORT`/`BACKEND_PORT`/`POSTGRES_PORT`/`REDIS_PORT` from `.env`). Seeded by default. |
| `demo` | `docker-compose.yml` + `docker-compose.prod.yml` | Built images, nginx in front, only `80`/`443` exposed. Seeded by default. |
| `production` | `docker-compose.yml` + `docker-compose.prod.yml` | Same as demo, but **seeding is skipped by default** (the seed creates known demo credentials — pass `--seed` to `install.sh` to force it). |

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
  update.sh
  backup.sh
  restore.sh
  healthcheck.sh
  uninstall.sh
  env-check.sh
backups/
  2026-07-02-1500/
    db.sql
    media.tar.gz
    env/{.env,.env.production}
    config/{docker-compose.yml,docker-compose.prod.yml,docker/,nginx/}
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
deployment/update.sh --env production
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
- **Migration fails on install/update**: check `dc logs backend` (or
  `docker compose logs backend`), then re-run `deployment/install.sh` or
  `deployment/update.sh` — migrations are safe to retry.
- **`healthcheck.sh` reports a container not running**: `docker compose ps`
  to see its state, `docker compose logs <service>` for why it exited.
- **Docker install step fails**: `install.sh` only supports Debian/Ubuntu and
  RHEL-family distros via Docker's official package repositories; on
  anything else, install Docker manually first, then re-run `install.sh` —
  it will detect Docker is present and skip straight past that step.

## CPOS integration

Every script here is designed to be driven non-interactively:

- `-y`/`--yes` (or `ASSUME_YES=1`) replaces every interactive prompt with
  automatic acceptance — no script blocks waiting for stdin when this is set.
- Scripts that aren't run with `-y`/`--yes` and aren't attached to a TTY
  **fail fast** with a clear error rather than hanging, so a misconfigured
  automated run never gets stuck.
- Exit codes are the automation contract: `0` = success, non-zero = failure.
  `healthcheck.sh` and `env-check.sh` are pure PASS/FAIL gates for this reason.
- `backup.sh` prints the created backup's path as its last line of stdout,
  so a caller can capture it directly (`BACKUP=$(deployment/backup.sh --yes | tail -1)`).
- `restore.sh` and `uninstall.sh` support `--dry-run` to preview a destructive
  action's exact effects before an automated system commits to it.
- `bootstrap.sh`'s nine steps are separate scripts specifically so an
  automated caller can observe/retry a single named step instead of only
  ever getting one pass/fail signal for the whole pipeline.

**Where CPOS calls in.** On a brand-new server, CPOS's provisioning step
would run `sudo deployment/bootstrap.sh --env production --yes` (after the
future curl-stub hand-off described above places a checkout at
`INSTALL_DIR`). On an existing server, CPOS drives `update.sh`/`backup.sh`/
`restore.sh`/`healthcheck.sh` directly, exactly as documented above. CPOS
itself is not implemented here — this section only documents the contract
these scripts already honor so CPOS can call them directly later.
