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
 * Cloudivo SMTP server, external storage, CPOS) are reported as `planned`
 * so CPOS can later render "not built yet" rather than a false negative.
 *
 * This is the foundation CPOS will poll (see the CPOS preparation notes in
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
    const checks = await Promise.all([
      this.checkApi(),
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkNotification(),
      ...this.futureChecks(),
    ]);

    const overall = checks.reduce<HealthStatus>((worst, c) => (STATUS_SEVERITY[c.status] > STATUS_SEVERITY[worst] ? c.status : worst), 'ok');

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks,
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

  private checkNotification(): Promise<HealthCheckResult> {
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
      { name: 'cpos', status: 'planned', message: 'CPOS does not exist yet — this sprint only prepares the data it will consume.' },
    ];
  }
}
