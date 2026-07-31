import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for app-level config that used to be read ad hoc via
 * `ConfigService.get(...)` at individual call sites. Starts with just the
 * rate limiter's settings; the intent is for this to be the one place any
 * cross-cutting, environment-driven setting is read from.
 */
@Injectable()
export class ServiceConfigService {
  constructor(private readonly configService: ConfigService) {}

  rateLimit(): { ttlMs: number; max: number } {
    return {
      ttlMs: this.configService.get<number>('RATE_LIMIT_TTL_MS', 60000),
      max: this.configService.get<number>('RATE_LIMIT_MAX', 300),
    };
  }

  /**
   * Public URL used to build links inside emails (reset links, invite
   * links, ...). `getOrThrow` is defense in depth, not the primary guard —
   * env.validation.ts's schema already requires FRONTEND_URL in production
   * (defaulting only in development/test), so this should only ever throw
   * if that schema is bypassed.
   */
  frontendUrl(): string {
    return this.configService.getOrThrow<string>('FRONTEND_URL').replace(/\/$/, '');
  }
}
