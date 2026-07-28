import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';

export type HealthStatus = 'ok' | 'degraded' | 'down' | 'not_configured' | 'planned';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  checks: HealthCheckResult[];
}

const STATUS_SEVERITY: Record<HealthStatus, number> = {
  ok: 0,
  not_configured: 0,
  planned: 0,
  degraded: 1,
  down: 2,
};

/**
 * Every check here is real — no fake "ok" placeholders for things that are
 * actually implemented. Checks with nothing to test yet (AI, the future
 * Cloudivo SMTP server, external storage, the Cloudivo Operations Center
 * (COC)) are reported as `planned` so COC can later render "not built yet"
 * rather than a false negative.
 *
 * Only CRITICAL_CHECKS below (api, database, redis, storage) feed `overall`
 * (and therefore HealthController's HTTP 503) — every other check
 * (notification_provider, and the still-`planned` future ones) is real,
 * reported honestly, and always visible in `checks`, but can never drag
 * `overall` down. Notification in particular must never block a deploy or
 * fail a healthcheck just because no mail relay is configured (see
 * checkNotification) or, for that matter, because a configured one is
 * temporarily unreachable — that's an operator-visible signal, not an
 * outage of Leinaflow itself.
 *
 * This is the foundation COC will poll (see the COC preparation notes in
 * Sprint 5D's report) — the shape of HealthReport is the contract, not this
 * sprint's HTTP transport.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  async check(): Promise<HealthReport> {
    const criticalChecks = await Promise.all([this.checkApi(), this.checkDatabase(), this.checkRedis(), this.checkStorage()]);
    const optionalChecks = await Promise.all([this.checkNotification(), ...this.futureChecks()]);

    // `overall` — and therefore HealthController's 503 — is decided by
    // criticalChecks alone. optionalChecks are appended to the report for
    // visibility but never participate in this reduce.
    const overall = criticalChecks.reduce<HealthStatus>((worst, c) => (STATUS_SEVERITY[c.status] > STATUS_SEVERITY[worst] ? c.status : worst), 'ok');

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: [...criticalChecks, ...optionalChecks],
    };
  }

  private async timed(name: string, fn: () => Promise<void>): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await fn();
      return { name, status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      this.logger.warn(`Health check "${name}" failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      return { name, status: 'down', latencyMs: Date.now() - start, message: 'Check failed — see server logs.' };
    }
  }

  private async checkApi(): Promise<HealthCheckResult> {
    // Answering at all proves the API is up — no external dependency to check.
    return { name: 'api', status: 'ok', latencyMs: 0 };
  }

  private checkDatabase(): Promise<HealthCheckResult> {
    return this.timed('database', async () => {
      await this.prisma.$queryRaw`SELECT 1`;
    });
  }

  private checkRedis(): Promise<HealthCheckResult> {
    return this.timed('redis', async () => {
      const result = await this.redisService.ping();
      if (result !== 'OK') throw new Error('Redis did not respond to PING');
    });
  }

  private checkStorage(): Promise<HealthCheckResult> {
    const probeKey = `.health/probe-${Date.now()}.txt`;
    return this.timed('storage', async () => {
      await this.storageService.saveBuffer(probeKey, Buffer.from('ok'));
      const exists = await this.storageService.exists(probeKey);
      await this.storageService.delete(probeKey);
      if (!exists) throw new Error('Storage probe file was not found after writing');
    });
  }

  // Optional by design: not one of the four critical checks (api, database,
  // redis, storage — see the class doc comment). Reported as
  // `not_configured` — not `down` — whenever no provider is actually
  // configured (NOTIFICATION_DRIVER=disabled, or "smtp" with SMTP_HOST left
  // blank), and crucially without ever calling verifyConnection() in that
  // case: that's what keeps a demo/production host with no mail relay set
  // up from triggering a DNS lookup/connection attempt just to answer a
  // health check, and from ever surfacing as HTTP 503 (see STATUS_SEVERITY —
  // `not_configured` carries the same severity as `ok`).
  private checkNotification(): Promise<HealthCheckResult> {
    if (!this.notificationService.isEnabled()) {
      return Promise.resolve({
        name: 'notification_provider',
        status: 'not_configured',
        message: 'No notification provider configured — set NOTIFICATION_DRIVER=smtp and SMTP_HOST to enable.',
      });
    }
    return this.timed('notification_provider', async () => {
      await this.notificationService.verifyConnection();
    });
  }

  /** Nothing to check yet — reported honestly as `planned`, not faked as `ok`. */
  private futureChecks(): HealthCheckResult[] {
    return [
      { name: 'ai', status: 'planned', message: 'No AI provider is wired up to check yet.' },
      { name: 'smtp_server', status: 'planned', message: 'Will check smtp.cloudivo.com once that service exists.' },
      { name: 'external_storage', status: 'planned', message: 'Only the local storage driver is implemented today.' },
      { name: 'coc', status: 'planned', message: 'COC does not exist yet — this sprint only prepares the data it will consume.' },
    ];
  }
}
