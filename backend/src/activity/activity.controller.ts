import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityService } from './activity.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findMany(@Query() query: QueryActivityLogDto, @Req() req: any) {
    // Admin-only for now (surfaced under the System admin section this
    // sprint). A workspace-scoped "your team's activity" view for regular
    // members is a natural next step, not built here.
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can view the activity log.');
    }
    return this.activityService.findMany({ workspaceId: query.workspaceId, page: query.page, limit: query.limit });
  }
}
