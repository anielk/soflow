# Rollback

Two independent things can go wrong with a deploy, and they roll back
differently: **bad code** (revert to a previous commit and redeploy) and
**bad data** (a migration or seed you need to undo, which needs a database
restore). Most rollbacks only need the first.

## 1. Code rollback (the common case)

No new migration, or the migration itself is safe — you just need last
release's code running again.

```bash
# On the target host, in the project checkout:
git log --oneline -10                 # find the last-known-good commit
git checkout <good-commit-or-tag>     # or: git revert <bad-commit>

docker compose -f compose.yml -f compose.prod.yml up -d --build
deployment/healthcheck.sh --env production
```

(Substitute `compose.demo.yml` for a demo rollback.) Because
`deployment/update.sh` also does `git pull --ff-only`, a `git checkout` to an
older commit will conflict with the next `update.sh` run until the host is
back on the branch tip — either push a revert commit upstream instead of
checking out detached, or fix the branch before the next update.

## 2. Data rollback (only when a migration or seed must be undone)

This is destructive — it overwrites the current database and media storage.
Always confirm you actually need this before running it; a bad code deploy
alone almost never does.

```bash
deployment/restore.sh --env production --dry-run   # see what would happen, touches nothing
deployment/restore.sh --env production              # pick a backup interactively and restore it
```

`restore.sh --backup <dir> --yes` restores a specific snapshot
non-interactively (for scripted/CPOS use). Every snapshot under
`backups/YYYY-MM-DD-HHMM/` (created by `deployment/backup.sh`, and always run
before `update.sh` per [Production.md](Production.md#before-every-deploy))
contains the database dump, media archive, `.env`/`.env.production`, and the
compose/nginx config that produced it — so a restore also puts the compose
files back to the state that matched that backup, not just the data.

## Prisma migration caveats

`prisma migrate deploy` (run by both `install.sh` and `update.sh`) only
applies forward migrations — it has no built-in "undo". If a bad migration
already ran in production:

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
until it passes.
