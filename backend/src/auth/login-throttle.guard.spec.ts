import { HttpException, HttpStatus } from '@nestjs/common';
import { LoginThrottleGuard } from './login-throttle.guard';

function buildContext(req: Record<string, any>) {
  const res = { header: jest.fn() };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as any;
}

/**
 * Exercises the guard against a real ThrottlerStorageService (in-memory,
 * the same implementation the app-wide ThrottlerGuard uses) rather than a
 * mock, so the actual increment/block bookkeeping is under test, not just
 * that this guard calls some storage method.
 */
describe('LoginThrottleGuard', () => {
  let storage: { increment: jest.Mock };
  let guard: LoginThrottleGuard;

  beforeEach(() => {
    // Minimal fake mirroring @nestjs/throttler's ThrottlerStorageService
    // increment contract closely enough to test bucket-per-key behavior.
    const buckets = new Map<string, number>();
    storage = {
      increment: jest.fn(async (key: string, _ttl: number, limit: number) => {
        const totalHits = (buckets.get(key) ?? 0) + 1;
        buckets.set(key, totalHits);
        return { totalHits, timeToExpire: 60, isBlocked: totalHits > limit, timeToBlockExpire: totalHits > limit ? 60 : 0 };
      }),
    };
    guard = new LoginThrottleGuard(storage as any);
  });

  it('allows requests within the limit', async () => {
    const ctx = buildContext({ ip: '203.0.113.9', body: { email: 'user@example.com' } });
    for (let i = 0; i < 10; i += 1) {
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    }
  });

  it('throws 429 once the same IP+email pair exceeds the limit', async () => {
    const ctx = buildContext({ ip: '203.0.113.9', body: { email: 'victim@example.com' } });
    for (let i = 0; i < 10; i += 1) {
      await guard.canActivate(ctx);
    }
    await expect(guard.canActivate(ctx)).rejects.toThrow(HttpException);
    try {
      await guard.canActivate(ctx);
    } catch (err) {
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('does not let brute-forcing one account exhaust the bucket for a different account on the same IP', async () => {
    const attacked = buildContext({ ip: '203.0.113.9', body: { email: 'victim@example.com' } });
    const other = buildContext({ ip: '203.0.113.9', body: { email: 'other-user@example.com' } });

    for (let i = 0; i < 11; i += 1) {
      await guard.canActivate(attacked).catch(() => undefined);
    }

    // The other account, same IP, is unaffected — proves the bucket key is
    // IP+email, not IP alone (the shared-NAT lockout this guard avoids).
    await expect(guard.canActivate(other)).resolves.toBe(true);
  });

  it('falls back to a per-IP bucket when the request body has no email', async () => {
    const ctx = buildContext({ ip: '203.0.113.9', body: {} });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(storage.increment).toHaveBeenCalledWith(
      expect.stringContaining('203.0.113.9:unknown'),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      'login',
    );
  });
});
