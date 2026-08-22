import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';

export interface DashboardStatsDto {
  totalCreators: number;
  activeCreators: number;
  mediaCount: number;
  storageBytes: number;
  memberCount: number;
  draftPostCount: number;
  scheduledPostCount: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  /** Every field is a live Prisma count/aggregate against real data — there is no cached or estimated figure to drift out of sync. */
  async getDashboardStats(userId: string): Promise<DashboardStatsDto> {
    const workspaceId = await this.workspaceService.resolveWorkspaceId(userId);

    const [totalCreators, activeCreators, mediaCount, sizeAgg, memberCount, draftPostCount, scheduledPostCount] = await Promise.all([
      this.prisma.creator.count({ where: { workspaceId } }),
      this.prisma.creator.count({ where: { workspaceId, status: 'ACTIVE' } }),
      this.prisma.media.count({ where: { workspaceId } }),
      this.prisma.media.aggregate({ where: { workspaceId }, _sum: { sizeBytes: true } }),
      this.prisma.workspaceMember.count({ where: { workspaceId } }),
      this.prisma.post.count({ where: { workspaceId, status: 'DRAFT' } }),
      this.prisma.post.count({ where: { workspaceId, status: 'SCHEDULED' } }),
    ]);

    return {
      totalCreators,
      activeCreators,
      mediaCount,
      storageBytes: Number(sizeAgg._sum.sizeBytes ?? 0n),
      memberCount,
      draftPostCount,
      scheduledPostCount,
    };
  }
}
