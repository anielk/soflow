# Production

Production runs the identical build/runtime configuration as demo — same
image targets, same read-only/non-root hardening, same nginx front door.
Nothing in `compose.prod.yml` differs from `compose.demo.yml`; only the
production host's own `.env` / `.env.production` content (real
`DATABASE_URL`, real `NEXT_PUBLIC_API_URL`, real SMTP credentials, real
`JWT_SECRET`/`SESSION_SECRET`, ...) does.

## Deploy

Use the deployment scripts rather than raw `docker compose` — they wrap
migrations, seeding policy, and health verification around the same compose
invocation:

```bash
deployment/install.sh --env production          # first install on a host
deployment/backup.sh --env production           # always back up first
deployment/update.sh --env production           # subsequent releases
```

The equivalent raw compose command (what those scripts run under the hood):

```bash
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

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
   and compose/nginx config to `backups/YYYY-MM-DD-HHMM/`.
2. Confirm the same change has already been verified on demo.
3. `deployment/update.sh --env production`.
4. `deployment/healthcheck.sh --env production` (also runs automatically at
   the end of `update.sh`).

If anything goes wrong, see [Rollback.md](Rollback.md).
