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
}
