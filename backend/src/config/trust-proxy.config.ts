/**
 * Number of reverse-proxy hops Express should trust when resolving the
 * real client IP from X-Forwarded-For — passed to
 * `app.getHttpAdapter().getInstance().set('trust proxy', TRUST_PROXY_HOPS)`
 * in main.ts. `req.ip` is what AuthController threads into every auth audit
 * event (login, registration, ...) and what ThrottlerGuard keys rate limits
 * on, so this single value is load-bearing for both.
 *
 * The actual request path in demo/production is:
 *
 *   Browser → Nginx Proxy Manager (NPM) → Next.js rewrite → NestJS backend
 *
 * That's two processes sitting between the browser and this backend, but
 * this is deliberately `1`, not `2`. Verified empirically (see
 * docs/architecture/ip-tracking.md for how, and
 * backend/src/auth/trust-proxy.integration.spec.ts for the regression
 * test): NPM is the only one of the two that actually writes to
 * X-Forwarded-For. Next.js's built-in rewrite proxy
 * (frontend/next.config.mjs) forwards whatever X-Forwarded-For it received
 * unchanged — it does not append its own hop. So from Express's
 * perspective there is effectively one proxy in the chain that matters for
 * this header, even though two processes relay the request.
 *
 * This is an assumption about NPM's and Next.js's current behavior, not
 * something this backend can enforce on its own — if either ever changes
 * (a second real reverse proxy added in front of NPM, a Next.js version
 * that starts appending its own X-Forwarded-For entry, or NPM being
 * reconfigured to not set the header), this value must be revisited
 * together with that change.
 *
 * A request that never passes through NPM at all (local dev, or someone
 * hitting this backend directly) won't carry this header — Express then
 * falls back to the direct TCP peer, which for this app is always another
 * container's internal Docker address, never a real public client IP. See
 * ip-address.util.ts's `classifyClientIp` — that address must be treated
 * as unknown, never presented or used as a real client location.
 */
export const TRUST_PROXY_HOPS = 1;
