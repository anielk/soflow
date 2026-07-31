# Rollback

Two independent things can go wrong with a deploy, and they roll back
differently: **bad code** (revert to a previous commit and redeploy) and
**bad data** (a migration or seed you need to undo, which needs a database
restore). Most rollbacks only need the first.

## 1. Code rollback (the common case)

No new migration, or the migration itself is safe — you just need last
release's code running again. `deployment/rollback.sh` automates this:

```bash
deployment/rollback.sh --env production                  # to the last commit
                                                           # deploy.sh recorded
                                                           # as a SUCCESS,
                                                           # other than the
                                                           # current one
deployment/rollback.sh --env production --to <commit-ish> # to a specific commit/tag
```

`deployment/history.sh --env production` shows the full deploy/rollback
history for the environment (timestamp, commit, duration, result) — useful
for picking a `--to` target or just seeing what already happened.

It resolves the target (reading `deployment/.deploy-history.log`, written by
every `deploy.sh` run, when `--to` isn't given). If the checkout has
uncommitted local changes, it explains what it found and **aborts
untouched** unless `--force` is given; with `--force`, those changes are
stashed first (named, timestamped, never discarded). It then
`git checkout --detach`s to the target, rebuilds, restarts, and runs
`deployment/healthcheck.sh` to confirm. No data is touched. See
[../Deployment.md, "rollback.sh"](../Deployment.md#rollbacksh--code-rollback-v1-documented-flow-code-path-implemented)
for its exit codes.

The manual equivalent, if you need it (a fresh host with no
`.deploy-history.log` yet, or a target `rollback.sh` can't resolve):

```bash
# On the target host, in the project checkout:
git log --oneline -10                 # find the last-known-good commit
git checkout --detach <good-commit-or-tag>

docker compose --env-file .env.production -f compose.yml -f compose.prod.yml up -d --build
deployment/healthcheck.sh --env production
```

(Substitute `compose.demo.yml` for a demo rollback.) Because
`deployment/deploy.sh` (and `update.sh`) reset/pull to `origin/main`'s tip, a
checkout to an older commit is only ever a stopgap — it leaves the host
behind `origin/main` until a real fix is pushed and redeployed, at which
point the next `deploy.sh`/`update.sh` run brings the branch tip back
(including whatever was wrong, if the actual fix hasn't landed yet).

## 2. Data rollback (only when a migration or seed must be undone)

This is destructive — it overwrites the current database and media storage.
Always confirm you actually need this before running it; a bad code deploy
alone almost never does.

```bash
deployment/restore.sh --env production --dry-run   # see what would happen, touches nothing
deployment/restore.sh --env production              # pick a backup interactively and restore it
```

`restore.sh --backup <dir> --yes` restores a specific snapshot
non-interactively (for scripted/COC use). Every snapshot under
`backups/YYYY-MM-DD-HHMM/` (created by `deployment/backup.sh`, and always run
before `deploy.sh` per [Production.md](Production.md#before-every-deploy))
contains the database dump, media archive, the resolved environment's one
env file (`.env.development` or `.env.production`), and the compose/docker
config that produced it — so a restore also puts the compose files back to
the state that matched that backup, not just the data.

## Prisma migration caveats

`prisma migrate deploy` (run by `install.sh`, `deploy.sh`, and `update.sh`)
only applies forward migrations — it has no built-in "undo". If a bad
migration already ran in production:

1. Restore the database from the last backup taken *before* that migration
   (`restore.sh`, above) — this is the only safe automatic path.
2. Or, if the migration is additive and backward-compatible (new nullable
   column, new table), it's often safe to just roll back the *code* (§1) and
   leave the migration in place — no data rollback needed.
3. Avoid hand-writing a "down" migration against a live production database
   unless you've verified it against a restored copy first.

## After any rollback

```bash
deployment/healthcheck.sh --env production
```

`healthcheck.sh` is a pure PASS/FAIL gate (Docker, containers, Postgres,
Redis, backend, frontend, disk, media) — don't consider a rollback complete
until it passes. `deployment/rollback.sh` already runs this as its last step
and fails loudly if it doesn't pass; this is for after a manual rollback, or
to re-confirm later.
