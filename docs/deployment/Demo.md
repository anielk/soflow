# Demo / Staging

Demo runs the exact same build as production: compiled Next.js output
(`next build` + `next start`), compiled NestJS output (`node dist/main`), no
bind mounts, no hot reload, behind nginx. Its entire purpose is to make
performance testing and acceptance review representative of what production
will actually run.

## Deploy

```bash
docker compose -f compose.yml -f compose.demo.yml up -d --build
```

`--build` matters here — unlike development, there's no bind mount to pick
up source changes; a new deploy means a new image build.

Prefer `deployment/install.sh --env demo` / `deployment/update.sh --env demo`
over calling `docker compose` directly on a real host — they also handle
Prisma migrations, seeding, and health verification. See
[../Deployment.md](../Deployment.md).

## What's running

| Service | Image target | Command | Exposure |
|---|---|---|---|
| frontend | `production` | `npm run start` | internal only (`expose: 3000`) |
| backend | `production` | `node dist/main` | internal only (`expose: 4000`) |
| nginx | `nginx:1.27-alpine` | — | published `80`/`443` |
| postgres / redis | — | — | internal only |

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
