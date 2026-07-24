import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SystemEvent } from '../events/system-event.interface';
import { EVENT_CATEGORIES } from '../events/event-types';

export interface ActivityLogFilters {
  workspaceId?: string;
  targetId?: string;
  targetType?: string;
  page?: number;
  limit?: number;
}

/**
 * The only writer of ActivityLog rows — see ActivityEventListener for the
 * normal write path. Unlike AuditService, this only records events that
 * carry a human-readable `message` (security-sensitive events like failed
 * logins are audited but intentionally never shown in a friendly activity
 * feed).
 */
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Same pattern as AuditService.resolveOwnWorkspaceId — see its comment. */
  async resolveOwnWorkspaceId(userId: string): Promise<string> {
    const membership = await this.prisma.workspaceMember.findFirst({ where: { userId }, orderBy: { joinedAt: 'asc' } });
    if (!membership) throw new Error('User is not a member of any workspace.');
    return membership.workspaceId;
  }

  async record(event: SystemEvent): Promise<void> {
    if (!event.message) return;
    try {
      await this.prisma.activityLog.create({
        data: {
          workspaceId: event.workspaceId,
          userId: event.userId,
          actorName: event.actorName,
          message: event.message,
          category: EVENT_CATEGORIES[event.type],
          targetType: event.targetType,
          targetId: event.targetId,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record activity for "${event.type}": ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  async findMany(filters: ActivityLogFilters) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const where: Prisma.ActivityLogWhereInput = {
      ...(filters.workspaceId ? { workspaceId: filters.workspaceId } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {}),
      ...(filters.targetType ? { targetType: filters.targetType } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
