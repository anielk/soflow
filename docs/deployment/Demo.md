# Demo / Staging

Demo runs the exact same build as production: compiled Next.js output
(`next build` + `next start`), compiled NestJS output (`node dist/main`), no
bind mounts, no hot reload. Its entire purpose is to make performance
testing and acceptance review representative of what production will
actually run.

## Deploy

```bash
docker compose --env-file .env.production -f compose.yml -f compose.demo.yml up -d --build
```

`--build` matters here — unlike development, there's no bind mount to pick
up source changes; a new deploy means a new image build. `--env-file
.env.production` matters too — without it, Compose won't find any values to
interpolate (see [Environment](#environment) below) and refuses to build.

Prefer `deployment/install.sh --env demo` (first install) /
`deployment/deploy.sh --env demo` (subsequent releases) over calling
`docker compose` directly on a real host — besides handling Prisma
migrations, seeding, health verification, and (for `deploy.sh`) a real HTTP
smoke test, they also always pass `--env-file` correctly for you. See
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

Demo reads exactly one env file: `.env.production` — used both for Compose's
own `${VAR}` interpolation and for the frontend/backend containers' actual
runtime env (via `env_file:` in compose.demo.yml). Production reads a file
with the same name, on its own host, with its own values (`DATABASE_URL`,
`NEXT_PUBLIC_API_URL`, SMTP target, etc.) — demo and production never read
each other's file, and neither ever reads `.env.development`. Nothing in the
compose files themselves is demo-specific.

`deployment/deploy.sh`/`install.sh` always pass `--env-file .env.production`
explicitly when invoking Compose for this overlay (see
`deployment/lib/common.sh`'s `env_file_for`/`dc`) — they never rely on
Compose's own implicit `.env` lookup. Running `docker compose` directly
against `compose.demo.yml` without `--env-file .env.production` fails fast
instead of silently building with blank or wrong-environment values: the
frontend's `NEXT_PUBLIC_API_URL` build arg carries a `${VAR:?...}`
required-variable guard specifically for this.

## Validating demo matches production

```bash
diff \
  <(docker compose --env-file .env.production -f compose.yml -f compose.demo.yml config) \
  <(docker compose --env-file .env.production -f compose.yml -f compose.prod.yml config)
```

An empty diff (aside from any deliberate, documented exception) confirms
demo and production run identical compose configuration — see
[Architecture.md](Architecture.md#verifying-demoproduction-parity).

## Seeding

`deployment/install.sh --env demo` seeds the database by default (creates
known demo credentials for reviewers) — pass `--no-seed` to skip.
