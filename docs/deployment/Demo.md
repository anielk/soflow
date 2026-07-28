# Demo / Staging

Demo runs the exact same build as production: compiled Next.js output
(`next build` + `next start`), compiled NestJS output (`node dist/main`), no
bind mounts, no hot reload. Its entire purpose is to make performance
testing and acceptance review representative of what production will
actually run.

## Deploy

```bash
docker compose -f compose.yml -f compose.demo.yml up -d --build
```

`--build` matters here — unlike development, there's no bind mount to pick
up source changes; a new deploy means a new image build.

Prefer `deployment/install.sh --env demo` (first install) /
`deployment/deploy.sh --env demo` (subsequent releases) over calling
`docker compose` directly on a real host — they also handle Prisma
migrations, seeding, health verification, and (for `deploy.sh`) a real HTTP
smoke test, checked from inside the frontend/backend containers rather than
through any particular reverse proxy topology. See
[../Deployment.md](../Deployment.md).

## What's running

| Service | Image target | Command | Exposure |
|---|---|---|---|
| frontend | `production` | `npm run start` | published on host port `80` (fixed — `80:3000`) |
| backend | `production` | `node dist/main` | internal only (`expose: 4000`) |
| postgres / redis | — | — | internal only |

Frontend's `80:3000` mapping is fixed, not `${FRONTEND_PORT}`-driven — the
existing external Nginx Proxy Manager already forwards to host port 80 and
must never need reconfiguring on a redeploy. Backend stays internal-only;
NPM reaches it through the frontend's own `/v1/:path*` rewrite
(`frontend/next.config.mjs`), not a published port. See
[Architecture.md#networking](Architecture.md#networking).

frontend/backend containers run `read_only: true` with a `tmpfs` `/tmp`, as
non-root (`1000:1000`) — same as production.

## Environment

Demo reads the same two files as every environment — root `.env` (compose
variable interpolation) and `.env.production` (container runtime env,
injected via `env_file:`) — except on the demo host these contain demo's own
values (its own `DATABASE_URL`, `NEXT_PUBLIC_API_URL`, SMTP target, etc.),
not development's or production's. Nothing in the compose files themselves
is demo-specific.

## Validating demo matches production

```bash
diff \
  <(docker compose -f compose.yml -f compose.demo.yml config) \
  <(docker compose -f compose.yml -f compose.prod.yml config)
```

An empty diff (aside from any deliberate, documented exception) confirms
demo and production run identical compose configuration — see
[Architecture.md](Architecture.md#verifying-demoproduction-parity).

## Seeding

`deployment/install.sh --env demo` seeds the database by default (creates
known demo credentials for reviewers) — pass `--no-seed` to skip.
