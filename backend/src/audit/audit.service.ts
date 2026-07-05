import { Injectable, Logger } from '@nestjs/common';
import { AuditCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EVENT_CATEGORIES } from '../events/event-types';
import { SystemEvent } from '../events/system-event.interface';

export interface AuditLogFilters {
  workspaceId?: string;
  userId?: string;
  category?: AuditCategory;
  eventType?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

/**
 * The only writer of AuditLog rows — see AuditEventListener for the normal
 * write path (subscribing to SystemEventsService) and audit.controller.ts
 * for the read-only query surface. There is deliberately no update/delete
 * method: audit entries are append-only for the lifetime of the app.
 *
 * Retention: nothing here enforces a retention window yet (out of scope for
 * this sprint per the brief). When it's built, it belongs as a scheduled job
 * calling a new `AuditService.purgeOlderThan(date)` — the `createdAt` index
 * already in place is exactly what that job would filter on.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(event: SystemEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: event.workspaceId,
          userId: event.userId,
          eventType: event.type,
          category: EVENT_CATEGORIES[event.type],
          targetType: event.targetType,
          targetId: event.targetId,
          metadata: (event.metadata as Prisma.InputJsonValue) ?? undefined,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      });
    } catch (err) {
      // An audit write must never break the action it's describing.
      this.logger.error(`Failed to record audit event "${event.type}": ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  async findMany(filters: AuditLogFilters) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const where = this.buildWhere(filters);

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items: await this.withUserLabels(items), total, page, limit };
  }

  /**
   * Best-effort display label for the page of results being returned — NOT
   * a stored relation (see the model comment on why AuditLog has no FK to
   * User). If the user no longer exists, `userLabel` is simply omitted; the
   * raw `userId` is still there for anyone who needs it.
   */
  private async withUserLabels<T extends { userId: string | null }>(items: T[]): Promise<(T & { userLabel: string | null })[]> {
    const userIds = [...new Set(items.map((i) => i.userId).filter((id): id is string => Boolean(id)))];
    if (userIds.length === 0) return items.map((i) => ({ ...i, userLabel: null }));

    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
    const labelById = new Map(users.map((u) => [u.id, u.name || u.email]));

    return items.map((i) => ({ ...i, userLabel: i.userId ? (labelById.get(i.userId) ?? null) : null }));
  }

  private buildWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters.workspaceId) where.workspaceId = filters.workspaceId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.category) where.category = filters.category;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      };
    }
    if (filters.search) {
      where.OR = [
        { eventType: { contains: filters.search, mode: 'insensitive' } },
        { targetType: { contains: filters.search, mode: 'insensitive' } },
        { targetId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }
}
