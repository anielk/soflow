# Production

Production runs the identical build/runtime configuration as demo — same
image targets, same read-only/non-root hardening. Nothing in
`compose.prod.yml` differs from `compose.demo.yml`; only the production
host's own `.env.production` content (real `DATABASE_URL`, real
`NEXT_PUBLIC_API_URL`, real SMTP credentials, real `JWT_SECRET`/
`SESSION_SECRET`, ...) does — demo's `.env.production` and production's are
two separate files that happen to share a name, one per host, never read by
the other. Production never reads `.env.development`.

Leinaflow doesn't deploy or configure a reverse proxy itself — see
[Architecture.md](Architecture.md#where-infrastructure-ends-and-leinaflow-begins).
In production that's typically a reverse proxy manager (Nginx Proxy Manager,
Traefik, Caddy, ...), running as its own infrastructure, either joining
`creator-network` directly or reaching a host-published port, depending on
how that host is set up.

## Deploy

Use the deployment scripts rather than raw `docker compose` — they wrap
migrations, seeding policy, and health verification around the same compose
invocation:

```bash
deployment/install.sh --env production          # first install on a host
deployment/backup.sh --env production           # always back up first
deployment/deploy.sh --env production           # subsequent releases
```

`deploy.sh` is the **Cloudivo Deployment Engine** — it fetches and resets to
`origin/main`, rebuilds, migrates, restarts, waits for backend/frontend
health, and runs a real HTTP smoke test (`/v1/health` and `/`, checked from
inside each container) before declaring success, printing the deployed
commit and how long it took. See
[../Deployment.md#the-deployment-engine-deploysh](../Deployment.md#the-deployment-engine-deploysh)
for the full step-by-step and its exit-code contract. `update.sh` (the
original `git pull --ff-only` → rebuild → restart → migrate path) still
works if you need it, but `deploy.sh` is the one to reach for on demo/production.

The equivalent raw compose command (what those scripts run under the hood):

```bash
docker compose --env-file .env.production -f compose.yml -f compose.prod.yml up -d --build
```

`--env-file .env.production` isn't optional here — Compose no longer has an
implicit `.env` to fall back to, and `NEXT_PUBLIC_API_URL` carries a
`${VAR:?...}` guard that refuses to build without it.

Full flag/script reference: [../Deployment.md](../Deployment.md).

## What's running

Identical service list, targets, and exposure to [Demo.md](Demo.md) — see
that doc's table. The only production-specific behavior in the
`deployment/*.sh` scripts is:

- **Seeding is skipped by default** (`install.sh --env production`) — the
  seed creates known demo credentials, which must never exist on a real
  production database. Pass `--seed` to force it (e.g. on a fresh install
  that intentionally wants demo data).
- Everything else — build, health checks, migration behavior — is the same
  path demo already exercised.

## Promotion flow

Changes reach production only after passing through development and demo:

```
Development (hot reload) -> git push -> Demo (production build) -> Acceptance -> Production
```

See [Architecture.md](Architecture.md#promotion-flow) for the full diagram
and rationale.

## Before every deploy

1. `deployment/backup.sh --env production` — snapshots DB, media, env files,
   and compose/docker config to `backups/YYYY-MM-DD-HHMM/`.
2. Confirm the same change has already been verified on demo.
3. `deployment/deploy.sh --env production`.
4. `deployment/status.sh --env production` — a quick read-only check of what's
   now running (`deploy.sh`'s own smoke test and health wait already gate
   step 3, so this is a glance, not a second gate).

If anything goes wrong, see [Rollback.md](Rollback.md) — `deployment/rollback.sh`
automates the common "roll back to the last known-good commit" case.
