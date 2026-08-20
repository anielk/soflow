# Client IP tracking

## The chain this backend actually sits behind

```
Browser → Nginx Proxy Manager (NPM) → Next.js rewrite (frontend) → NestJS backend
```

NPM and the Next.js rewrite are both infrastructure this repo doesn't
control end-to-end (NPM is operator-configured; the rewrite is
`frontend/next.config.mjs`), but the backend's own `req.ip` — used by every
auth audit event (login, registration, ...) and by `ThrottlerGuard`'s
rate-limit key — depends on correctly trusting exactly the right number of
hops in front of it. Getting this wrong doesn't fail loudly: it silently
records the wrong IP for everyone, forever, until someone notices audit
logs full of the same internal address.

## Why `trust proxy` is `1`, not `2`

Two processes sit between the browser and this backend, so it would be
easy to assume `trust proxy` needs to be `2`. It doesn't, and this was
verified experimentally, not assumed:

- NPM receives the request directly from the browser and writes
  `X-Forwarded-For: <browser-ip>` before forwarding to the frontend.
- The frontend's Next.js rewrite receives that request and proxies it to
  the backend — but Next's built-in rewrite proxy does not append its own
  hop to `X-Forwarded-For`. It forwards the header through unchanged.
- So the backend only ever sees a single-entry `X-Forwarded-For`, written
  by NPM. `trust proxy: 1` (trust exactly one hop, and read the client
  address out of that one entry) is therefore correct — confirmed by
  sending a request with a known, spoofed `X-Forwarded-For` value directly
  at the frontend container and observing that exact value land in
  `AuditLog.ipAddress` at the backend, through the real rewrite path.

This is an assumption about NPM's and Next.js's *current* behavior, not
something the backend enforces. It breaks silently if:

- a second real reverse proxy is ever added in front of NPM,
- NPM is reconfigured to not set `X-Forwarded-For`, or
- a future Next.js version starts appending its own hop to the header.

The actual value lives in `backend/src/config/trust-proxy.config.ts` (not
duplicated here) so there is exactly one place to change it, and
`backend/src/auth/trust-proxy.integration.spec.ts` exercises it through a
real Express instance so a change to that value — or to how the backend
resolves `req.ip` from a forwarded header — fails a test instead of failing
silently.

### What this doesn't cover

The integration test above proves the *backend's* trust-proxy resolution
is correct given a certain `X-Forwarded-For` value. It cannot exercise NPM
itself (infrastructure, not a Node process this test suite can boot) or
the actual Next.js rewrite in production (a separate container). Those two
assumptions — "NPM sets the header," "Next's rewrite doesn't touch it" —
are verified by the experiment described above, not by anything that runs
in CI. If either NPM's config or the frontend's rewrite behavior ever
changes, this doc and the backend's trust-proxy value need revisiting
together; nothing will fail a test to prompt that.

## The rule for what an IP is allowed to mean

No geolocation, VPN detection, or anomaly detection exists yet (deliberately
— see the security gap report this doc follows up on). But the rule for
how any resolved IP may be *interpreted* is established now, before any of
that is built, via `backend/src/common/ip-address.util.ts`'s
`classifyClientIp`:

| Case | Classification | Meaning |
|---|---|---|
| A real public address | `'public'` | Usable as a real client location, once geolocation exists. |
| A private/loopback/link-local address (RFC1918, `127.0.0.1`, Docker's own bridge ranges, `::1`, `fe80::/10`, `fc00::/7`) | `'private'` | This backend's own network, or a request that never passed through NPM (local dev, direct access). Never a real client location. |
| Missing or unparseable | `'unknown'` | No signal at all. |

`'private'` and `'unknown'` are kept distinct in the return type because
they're different diagnostic signals (a Docker address vs. no address at
all), but any future geolocation/anomaly code must treat both identically:
**neither is ever resolved to a country, and neither is ever a basis for
blocking a request.** Only `'public'` is eligible for that, once that
feature exists.
