# Rate limiting

## What was here before

`main.ts` used to run a hand-rolled Express middleware as a global rate
limiter:

```js
const requestId = req.socket.remoteAddress! + req.method;
// ...count += 1, stored in a Map keyed by requestId...
if (currentCount > 100) return res.send('Too Many Requests');
```

This had three compounding defects:

1. **No time window.** `startTime` was recorded but never checked against —
   the counter never reset. It was a lifetime count per `(remoteAddress,
   method)`, not a rate limit.
2. **Keyed by IP+method only, not by route.** Every `POST`/`PUT`/`PATCH` in
   the app — register, login, workspace save, profile save, media rename,
   add member, add creator, contact form, etc. — shared one counter per
   method. Since every request in this deployment arrives from the same
   upstream (the frontend's dev proxy, or nginx in front of it), that
   counter was effectively shared by the whole app's traffic, not per real
   client.
3. **`res.send()` with no status code set**, which defaults to `200 OK` with
   a `text/html` body of `"Too Many Requests"`. Every frontend save call
   checks `!response.ok` before parsing JSON — since the status was 200,
   that check never fired, and `.json()` on the HTML body threw a raw
   `SyntaxError`. In practice: after 100 cumulative requests of a given
   method since boot, every further request of that method failed silently
   and permanently, across every page using that method, until the process
   restarted.

## What's here now

`@nestjs/throttler`'s `ThrottlerModule` + `ThrottlerGuard`, registered
globally in `app.module.ts` via `APP_GUARD`. Configuration comes from
`ServiceConfigService.rateLimit()` (`RATE_LIMIT_TTL_MS` / `RATE_LIMIT_MAX`,
see `env.validation.ts`), following the same config-layer pattern as every
other external-facing setting in this app.

This fixes all three defects above:

- **Real rolling window** — `ttl`/`limit` define requests-per-window, not a
  lifetime count. The window naturally rolls forward; nothing needs a
  restart to recover.
- **Throws a real `HttpException`** (`ThrottlerException`, status 429),
  which flows through the same global `HttpExceptionFilter` as every other
  error in the app — same JSON shape (`{ statusCode, timestamp, path, error
  }`), plus a `Retry-After` header. The frontend's existing `!response.ok`
  checks work correctly against it.
- **One global bucket per client IP**, not per method/route. This is a
  deliberate simplification for a single-dev-server / small-deployment app —
  not a per-endpoint quota system. If a specific route ever needs its own
  budget, that's `@Throttle()` on that route, not a change here.

## Reverse proxy correctness

`ThrottlerGuard` keys its bucket on `req.ip`. Behind a reverse proxy (nginx
in production, the frontend's Next.js dev-mode rewrite locally), the
"client" Express sees by default is the proxy itself, not the real caller —
which would put the *entire app's* traffic back into one shared bucket,
reintroducing the same class of bug this fix was meant to close.

`main.ts` sets `app.getHttpAdapter().getInstance().set('trust proxy', 1)` so
Express reads the real client address out of `X-Forwarded-For` (one hop
back from the direct connection) instead of trusting the socket address.
`nginx/default.conf` already sets `X-Forwarded-For: $proxy_add_x_forwarded_for`
on both the `/api/` and `/` locations, so this is correct as soon as nginx
(or any single reverse proxy) sits in front — no further change needed to
move this app behind one.
