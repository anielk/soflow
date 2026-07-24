import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityService } from './activity.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * A SUPER_ADMIN gets the unrestricted, all-workspaces view (System admin
   * page). Anyone else — e.g. a Creator detail page's Activity tab — always
   * has `workspaceId` overridden to their own resolved workspace, never
   * whatever the client sent.
   */
  @Get()
  async findMany(@Query() query: QueryActivityLogDto, @Req() req: any) {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const workspaceId = isSuperAdmin ? query.workspaceId : await this.activityService.resolveOwnWorkspaceId(req.user.userId);
    return this.activityService.findMany({
      workspaceId,
      targetId: query.targetId,
      targetType: query.targetType,
      page: query.page,
      limit: query.limit,
    });
  }
}
