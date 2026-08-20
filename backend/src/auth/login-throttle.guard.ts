import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectThrottlerStorage, ThrottlerStorage } from '@nestjs/throttler';

/**
 * Read directly from process.env, same as trust-proxy.config.ts — this
 * runs once at module load, well before env.validation.ts's Joi schema
 * (which documents these same two vars, with the same defaults) finishes
 * validating via ConfigModule at bootstrap. Kept in sync with that schema
 * by convention, not by sharing code.
 */
const LOGIN_THROTTLE_TTL_MS = Number(process.env.LOGIN_RATE_LIMIT_TTL_MS) || 60_000;
const LOGIN_THROTTLE_LIMIT = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10;
const THROTTLER_NAME = 'login';

/**
 * A dedicated, much stricter brute-force throttle for POST /auth/login,
 * layered on top of (not replacing) the app-wide ThrottlerGuard registered
 * as APP_GUARD in app.module.ts — that one still applies to this route too,
 * sized for normal API traffic (see ServiceConfigService.rateLimit()).
 *
 * Requests/window: LOGIN_THROTTLE_LIMIT attempts per LOGIN_THROTTLE_TTL_MS
 * (default 10 per 60s).
 *
 * Bucket key: `${req.ip}:${email}` — the IP AND the attempted email
 * together, not the IP alone. A pure IP-only rule would let one attacker
 * hammering a single account from behind a shared NAT/corporate proxy lock
 * out every other legitimate user on that same IP trying to log into their
 * own, different account. Keying on the pair means brute-forcing account A
 * only ever throttles further attempts against account A from that IP;
 * account B's owner on the same network is unaffected. A request with no
 * parseable email in the body (malformed input) falls back to the literal
 * string 'unknown' — still scoped per-IP, just without the extra per-account
 * split, since there's no account to disambiguate.
 *
 * Behavior after the limit is exceeded: every further request in the
 * window gets HTTP 429 (Too Many Requests) — no account lockout, nothing
 * persisted beyond the in-memory throttle bucket itself. The bucket clears
 * once LOGIN_THROTTLE_TTL_MS elapses with no new hits.
 *
 * Reuses the ThrottlerStorage the framework already provides (the same
 * in-memory store the global ThrottlerGuard uses — ThrottlerModule is
 * @Global(), so this token is injectable here without importing that
 * module) rather than hand-rolling a counter, but implements CanActivate
 * directly instead of extending ThrottlerGuard: that class's multi-throttler
 * loop applies every registered named throttler to every route by name, and
 * there is no clean way to scope one purely to this single route without
 * also touching every other controller. A route-scoped guard is simpler and
 * has zero effect on any other endpoint's throttling.
 */
@Injectable()
export class LoginThrottleGuard implements CanActivate {
  constructor(@InjectThrottlerStorage() private readonly storage: ThrottlerStorage) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = `login-throttle:${buildTracker(req)}`;

    const { isBlocked, timeToBlockExpire } = await this.storage.increment(
      key,
      LOGIN_THROTTLE_TTL_MS,
      LOGIN_THROTTLE_LIMIT,
      LOGIN_THROTTLE_TTL_MS,
      THROTTLER_NAME,
    );

    if (isBlocked) {
      const res = context.switchToHttp().getResponse();
      res.header?.('Retry-After', timeToBlockExpire);
      throw new HttpException('Too many login attempts. Please wait before trying again.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}

function buildTracker(req: Record<string, any>): string {
  const email = typeof req.body?.email === 'string' && req.body.email.trim() ? req.body.email.trim().toLowerCase() : 'unknown';
  return `${req.ip}:${email}`;
}
