# COC Integration

This document describes how the future **Cloudivo Operations Center (COC)**
is expected to control and monitor a Leinaflow install through
`deployment/`, once it exists. **COC itself is not built here.** Nothing in
this document is implemented as a live integration — it describes the
architecture the deployment scripts already expose so that building COC
later doesn't require changing any of them.

Everything COC needs is either a file on disk (`server.json`,
`history.json`) or a `--json` flag on a script that already runs today
(`deploy.sh`, `rollback.sh`, `status.sh`). COC's job, later, is to be a
client of these — polling files, invoking scripts, parsing their output. If
you're implementing COC: start here, then read the specific script's own
`--help` output and docs/Deployment.md for the full flag/exit-code
reference.

## Server discovery

Every install has a `deployment/server.json`, created by `install.sh` and
refreshed by `deploy.sh`/`rollback.sh` after every successful run:

```json
{
  "serverId": "e391f765-3724-47d8-980d-3b52dd6cb8d5",
  "environment": "production",
  "hostname": "prod-1.example.com",
  "platform": "Leinaflow",
  "version": "0.1.0",
  "deploymentEngine": "1.0",
  "updatedAt": "2026-07-26T18:57:19+00:00"
}
```

- **serverId** is generated once (a UUID) and never changes again for the
  life of the install — the same "generate once, persist forever" approach
  already used for `JWT_SECRET`/`SESSION_SECRET` (see
  `lib/common.sh#ensure_env_files`). This is the stable identifier COC
  would key a server record on.
- **environment**/**version**/**updatedAt** are refreshed on every deploy or
  rollback, so a stale `server.json` (old version, old timestamp) is itself
  a signal something hasn't redeployed recently.
- **platform** is always `"Leinaflow"` today; `deploymentEngine` is the
  version of this tooling (`deployment/*.sh`), not of Leinaflow itself —
  the two version independently, and a future Cloudivo product built on
  this same layering (see `docs/deployment/Architecture.md`'s
  "Multi-product naming" section) would report its own `platform` here
  with the same `deploymentEngine`.

**How COC would eventually discover servers**: none of that is built. The
plausible shape — not implemented — is periodic or on-connect delivery of
this file's contents from each host to a COC backend (push), or COC polling
each known host's `server.json` over some transport it owns (pull). Either
way, `server.json` is the payload; nothing here assumes which direction it
travels.

`server.json` is host-local and gitignored (see `.gitignore`) — it
describes one specific running install, not the codebase.

## Deployment flow

`deploy.sh` is unchanged in what it does — git reset, build, migrate,
start, health-check, smoke-test (see `docs/Deployment.md#the-deployment-engine-deploysh`
for the full step list and exit codes). `--json` changes only how it
*reports* that:

```bash
deployment/deploy.sh --env production --yes --json
```

- Every human-readable line (`[INFO]`/`[ OK ]`/`[WARN]`/`[FAIL]`, all still
  timestamped) moves to **stderr**.
- Exactly one JSON object is printed to **stdout**, as the last thing the
  process does before exiting — a caller can safely treat "read stdout to
  EOF, parse it as one JSON value" as the whole contract, regardless of
  whether the deploy succeeded or failed.
- The exit code is unchanged either way — `--json` doesn't add or remove
  any exit code documented in `deploy.sh`'s own header.

Shape (see `deploy.sh`'s `emit_json_result`):

```json
{
  "schema_version": "1.0",
  "script": "deploy.sh",
  "deployment_engine": "1.0",
  "environment": "production",
  "version": "0.1.0",
  "commit": "f5ea72fb2a223360003d607b11a7a2dbece50e00",
  "commit_short": "f5ea72f",
  "branch": "main",
  "timestamp": "2026-07-26T18:46:41+00:00",
  "duration_seconds": 187,
  "exit_code": 0,
  "result": "success",
  "stage": "Summary",
  "message": "Deploy complete (env: production)."
}
```

`result` is one of `success` / `failed`. On failure, `stage` names exactly
which of `deploy.sh`'s numbered steps it failed during (`"Git fetch/reset"`,
`"Docker image build"`, `"Database migration"`, `"Starting containers"`,
`"Health verification"`, `"Smoke tests"`) — the same information the
per-stage exit code already carries, just named instead of numbered. A
`--help` invocation, or `--data-rollback`-equivalent no-op paths, never
print this object — only an actual attempted deploy/rollback does.

Every attempt (success or failure) also appends a row to
`deployment/.deploy-history.log` and regenerates `deployment/history.json`
— see Monitoring flow below.

## Rollback flow

Same idea, on `rollback.sh`:

```bash
deployment/rollback.sh --env production --json          # to the last known-good deploy
deployment/rollback.sh --env production --to <ref> --json
```

Adds `from_commit`/`to_commit` (both `null` until resolved — e.g. an
argument error fires before either is known) alongside the same envelope
`deploy.sh` uses:

```json
{
  "schema_version": "1.0",
  "script": "rollback.sh",
  "deployment_engine": "1.0",
  "environment": "production",
  "version": "0.1.0",
  "commit": "41023ef618d7d24fd32e1abbd07c828c3883eb9c",
  "commit_short": "41023ef",
  "branch": "HEAD",
  "from_commit": "41eb9701d8b83d69d8340309781852db0f0c27a7",
  "to_commit": "41023ef618d7d24fd32e1abbd07c828c3883eb9c",
  "timestamp": "2026-07-26T18:52:58+00:00",
  "duration_seconds": 12,
  "exit_code": 0,
  "result": "success",
  "stage": "Summary",
  "message": "Rollback complete — production is now running 41023ef."
}
```

`result` is one of:

- `success` — rolled back and verified healthy.
- `noop` — the resolved target was already `HEAD`; nothing changed.
- `cancelled` — the operator declined the interactive confirmation (or, for
  an automated caller, ran without `-y`/`--yes` and without a TTY).
- `failed` — see `stage` for which step, same as `deploy.sh`.

`rollback.sh --data-rollback` (prints the data-rollback guidance and exits)
and `-h`/`--help` never print this object, for the same reason as
`deploy.sh` — neither is an attempted rollback.

Data rollback (a migration/seed that needs undoing) is deliberately **not**
part of this JSON contract — it's destructive, already fully owned by
`restore.sh`, and `rollback.sh --data-rollback` only ever prints guidance
toward it. If COC ever needs to drive a data rollback, that's a separate,
explicitly-authorized flow to design later — not an extension of this one.

## Monitoring flow

Three complementary sources, all read-only:

**`status.sh --json`** — a snapshot of *right now*: git state, per-service
Docker container state/health, the last recorded deploy for the
environment, and a `health` object shaped exactly like this document's
"health endpoint" requirement:

```bash
deployment/status.sh --env production --json
```

```json
{
  "schema_version": "1.0",
  "script": "status.sh",
  "deployment_engine": "1.0",
  "environment": "production",
  "version": "0.1.0",
  "result": "ok",
  "exit_code": 0,
  "timestamp": "2026-07-26T18:55:00+00:00",
  "env": "production",
  "git": { "commit": "...", "short": "...", "branch": "...", "subject": "...", "dirty": false },
  "services": [ { "name": "backend", "state": "running", "health": "healthy" }, "..." ],
  "last_deploy": { "timestamp": "...", "commit": "...", "duration_seconds": 187, "status": "SUCCESS", "branch": "main" },
  "health": {
    "version": "0.1.0",
    "commit": "f5ea72fb2a223360003d607b11a7a2dbece50e00",
    "deployment_time": "2026-07-26T18:46:41+00:00",
    "uptime_seconds": 12345,
    "backend_healthy": true,
    "frontend_healthy": true,
    "database_reachable": true,
    "storage_healthy": true
  }
}
```

`env`/`git`/`services`/`last_deploy` are the original fields this script
already had before this document existed — their shape never changes;
`schema_version` through `health` are additive. `backend_healthy` and
`frontend_healthy` come from Docker's own container health (liveness —
see `compose.yml`'s backend healthcheck comment for why that's
deliberately shallow); `database_reachable` and `storage_healthy` come from
the backend's own real `/v1/health` report (a live `SELECT 1` and a real
storage write/read/delete probe — see
`backend/src/health/health.service.ts`), fetched from inside the backend's
own container so this works identically in every environment, regardless of
how (or whether) a reverse proxy in front of it is set up. If the backend
isn't running or doesn't respond in time,
these read `false`/`null` — never a false `true`.

**`deployment/history.json`** — every deploy/rollback attempt ever
recorded, regenerated from `deployment/.deploy-history.log` on every
attempt (success or failure):

```json
[
  {
    "timestamp": "2026-07-26T18:53:06+00:00",
    "environment": "production",
    "commit": "41023ef618d7d24fd32e1abbd07c828c3883eb9c",
    "commit_short": "41023ef618d7",
    "branch": "HEAD",
    "duration_seconds": 187,
    "status": "SUCCESS",
    "rollback": { "is_rollback": false, "from_commit": null }
  }
]
```

Newest entry last (append order) — `deployment/history.sh --json` (or
`history.sh` with no flags, for a human table) gives the same data
newest-first with optional `--env` filtering, if that's a more convenient
read than the raw file. Both read from the same `.deploy-history.log`
`history_line_to_json` in `lib/common.sh` converts — see that file's
"Deployment history" section for the exact column list.

**Exit-code gates**, for anything that just needs pass/fail without
parsing JSON: `healthcheck.sh` (0/1) and `env-check.sh` (0/1) are pure
gates, unaffected by any of the above.

Suggested polling cadence for a future COC (not enforced anywhere): treat
`server.json` as slow-changing (poll on connect, or every few minutes) and
`status.sh --json`/`history.json` as the thing to poll more frequently for
a live dashboard.

## Future authentication

Not implemented. Every script here already runs locally, on the host being
managed, with whatever OS-level permissions the invoking user has — there
is no network-facing control surface today for COC to authenticate
*against*. When COC gains one (an agent process on each host, a pull-based
poller, or something else — undecided), it will need its own
authentication design at that point: how a host proves its identity to
COC (`server.json`'s `serverId` is a plausible starting point, but is not
a credential — it's not secret, and possessing it proves nothing), how COC
proves it's authorized to command a host, and how secrets involved in that
handshake are provisioned and rotated. None of that is designed here on
purpose — building it now, before COC's actual transport and threat model
exist, would mean guessing at requirements this sprint has no way to get
right.
