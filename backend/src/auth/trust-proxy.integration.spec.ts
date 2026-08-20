import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { getStorageToken } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TRUST_PROXY_HOPS } from '../config/trust-proxy.config';
import { classifyClientIp } from '../common/ip-address.util';

/**
 * The risk this suite exists to catch is the PROXY CHAIN, not `req.ip` in
 * isolation — see docs/architecture/ip-tracking.md. It boots a real Nest
 * HTTP application (real Express instance, real routing, the exact
 * `trust proxy` setting main.ts applies) and drives it over an actual HTTP
 * request via supertest, so a regression in any of the following fails
 * this test:
 *
 *   - main.ts / trust-proxy.config.ts no longer trusting the right number
 *     of hops
 *   - AuthController no longer passing req.ip / the user-agent header
 *     through to AuthService.register
 *
 * What it CANNOT catch (see docs/architecture/ip-tracking.md's "What this
 * doesn't cover"): whether Nginx Proxy Manager actually sets
 * X-Forwarded-For in production, or whether the real Next.js rewrite
 * forwards it unchanged. Those were verified experimentally against the
 * real deployment, not by anything that runs here — this suite exercises
 * only the boundary the backend itself controls.
 */
describe('Trust-proxy chain → AuthController.register', () => {
  let app: INestApplication;
  const registerMock = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { register: registerMock } },
        // AuthController also declares the login route, which carries
        // LoginThrottleGuard — this suite only exercises /register, but
        // Nest still resolves every provider the controller depends on
        // when the module compiles, so the guard's storage dependency
        // needs a stub here regardless.
        { provide: getStorageToken(), useValue: { increment: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mirrors main.ts exactly — same imported constant, so a future change
    // to that value is exercised here, not re-declared.
    app.getHttpAdapter().getInstance().set('trust proxy', TRUST_PROXY_HOPS);
    app.setGlobalPrefix('v1', { exclude: [''] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    registerMock.mockReset();
    registerMock.mockResolvedValue({ access_token: 'irrelevant' });
  });

  const validBody = { email: 'proxy-test@example.com', password: 'testpass123', username: 'proxytestagency' };

  it('resolves req.ip to the X-Forwarded-For value a trusted proxy set, exactly as NPM would', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .set('X-Forwarded-For', '203.0.113.9')
      .set('User-Agent', 'IntegrationTestAgent/1.0')
      .send(validBody)
      .expect(201);

    expect(registerMock).toHaveBeenCalledTimes(1);
    const [, resolvedIp, resolvedUserAgent] = registerMock.mock.calls[0];
    expect(resolvedIp).toBe('203.0.113.9');
    expect(resolvedUserAgent).toBe('IntegrationTestAgent/1.0');
    expect(classifyClientIp(resolvedIp)).toBe('public');
  });

  it('with a SECOND hop present in X-Forwarded-For, resolves to that hop, not the original client — demonstrating exactly the fragility ip-tracking.md documents', async () => {
    // A well-formed multi-proxy header is "client, proxy1" (each additional
    // real hop appends its own perceived previous address to the right).
    // With trust proxy = 1, Express peels exactly one layer beyond the raw
    // socket connection and returns the RIGHTMOST entry — verified here,
    // not assumed. In production today this never has two entries (NPM is
    // the only writer; the Next.js rewrite passes the header through
    // unchanged — see docs/architecture/ip-tracking.md), so the rightmost
    // entry IS the real client. But this test proves what would happen if
    // that ever changed without also bumping TRUST_PROXY_HOPS to 2: the
    // resolved "client" IP would silently become the wrong hop's address,
    // not the browser's — exactly the risk the docs call out, not a
    // theoretical one.
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .set('X-Forwarded-For', '203.0.113.9, 198.51.100.1')
      .send(validBody)
      .expect(201);

    const [, resolvedIp] = registerMock.mock.calls[0];
    expect(resolvedIp).toBe('198.51.100.1');
    expect(resolvedIp).not.toBe('203.0.113.9');
  });

  it('falls back to the direct socket address with no X-Forwarded-For — an internal/dev request, never a real client IP', async () => {
    await request(app.getHttpServer()).post('/v1/auth/register').send(validBody).expect(201);

    const [, resolvedIp] = registerMock.mock.calls[0];
    // supertest connects over the loopback interface — this is exactly the
    // "no reverse proxy in front of this request" case (local dev, or
    // someone hitting the backend directly): classified private/unknown,
    // never treated as a real public client IP.
    expect(classifyClientIp(resolvedIp)).not.toBe('public');
  });
});
