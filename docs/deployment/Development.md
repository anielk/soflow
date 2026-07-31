# Development

Local development stack: hot reload on both frontend and backend, source
mounted straight from your working copy, all app ports published to the
host.

## Start

```bash
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml up -d
```

First run (or after changing a Dockerfile / `package.json`), add `--build`.
If `.env.development` doesn't exist yet, copy it from
`.env.development.example` first (or run `deployment/install.sh --env
development`, which does this for you).

## What's running

| Service | Image target | Command | Host port |
|---|---|---|---|
| frontend | `development` | `npm run dev` (Next.js dev server) | `${FRONTEND_PORT}` (default 3000) |
| backend | `development` | `npm run start:dev` (`nest start --watch`) | `${BACKEND_PORT}` (default 4000) |
| postgres | `postgres:16-alpine` | — | `${POSTGRES_PORT}` (default 5432) |
| redis | `redis:7-alpine` | — | `${REDIS_PORT}` (default 6379) |
| mailhog | `mailhog/mailhog` | — | web UI on `8025` |

`compose.dev.yml` bind-mounts `frontend/src`, `frontend/public`, the Next.js
config files, and `backend/src` + `backend/prisma` straight from your
working copy — edit a file locally and both dev servers reload automatically.

## Common commands

```bash
# Logs
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml logs -f backend
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml logs -f frontend

# Run a one-off command inside a container
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml exec backend npm run prisma:migrate:dev
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml exec backend npm run prisma:seed

# Stop everything (keeps volumes: Postgres/Redis data, media)
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml down

# Stop and wipe all data (fresh database)
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml down -v
```

(Or use `deployment/*.sh --env development`, which pass `--env-file`
automatically — see [Environment variables](#environment-variables) below.)

Mailhog catches all outgoing SMTP mail sent by the backend in development —
open `http://localhost:8025` to see it instead of it hitting a real inbox.

## Known dev-only quirk: backend watch-mode restarts

`nest start --watch` occasionally logs `EADDRINUSE` (or, rarely, a
`Segmentation fault`) when it restarts after a backend file change — the old
process hasn't released port 4000 yet when the new one starts. This is a
pre-existing characteristic of NestJS's watch-mode process handling
(`backend/src/main.ts` doesn't call `app.enableShutdownHooks()`, so the old
process doesn't close its listeners cleanly on the restart signal), not
something introduced by this compose/Dockerfile restructure — the merged
container configuration is unchanged from before, only split across two
files (verify with `docker compose --env-file .env.development -f
compose.yml -f compose.dev.yml config`).

When it happens, the previous process keeps serving (the container stays
healthy), but your latest change won't be live until you restart the
container:

```bash
docker compose --env-file .env.development -f compose.yml -f compose.dev.yml restart backend
```

If this becomes annoying enough to fix properly, adding
`app.enableShutdownHooks()` in `backend/src/main.ts` is the actual fix — out
of scope for this change since it's application code, not deployment
architecture.

## Environment variables

Development reads exactly one env file: `.env.development` (copy it from
`.env.development.example` if it doesn't exist yet, or let
`deployment/install.sh --env development` create it). It's used both for
Compose's own `${VAR}` interpolation (`${POSTGRES_DB}`, `${FRONTEND_PORT}`,
...) and for the frontend/backend containers' actual runtime env, via
`env_file:` in `compose.dev.yml` — always passed explicitly with
`--env-file`, never left to Compose's own implicit `.env`-in-cwd lookup
(there's no plain `.env` at the repo root to find). See
[../Deployment.md](../Deployment.md#environment-variables) for the full
variable reference and [Architecture.md](Architecture.md) for how this
compares to demo/production's `.env.production`.
