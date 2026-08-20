import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { publishForbidden } from '../common/guards/publish-forbidden';
import { SystemEventsService } from '../events/system-events.service';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly systemEvents: SystemEventsService,
  ) {}

  private assertSuperAdmin(req: any): void {
    if (req.user?.role !== 'SUPER_ADMIN') {
      publishForbidden(this.systemEvents, req, ['SUPER_ADMIN'], 'super_admin_check');
      throw new ForbiddenException('Only a super admin can view audit logs.');
    }
  }

  /**
   * A SUPER_ADMIN gets the unrestricted, all-workspaces view (used by the
   * System admin page). Anyone else can still query — e.g. a Creator
   * detail page's Audit tab — but their `workspaceId` is always overridden
   * to their own resolved workspace, never whatever the client sent, so a
   * regular member can only ever see their own workspace's history.
   */
  @Get()
  async findMany(@Query() query: QueryAuditLogDto, @Req() req: any) {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const workspaceId = isSuperAdmin ? query.workspaceId : await this.auditService.resolveOwnWorkspaceId(req.user.userId);
    return this.auditService.findMany({
      workspaceId,
      userId: query.userId,
      category: query.category,
      eventType: query.eventType,
      targetId: query.targetId,
      targetType: query.targetType,
      search: query.search,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('categories')
  getCategories(@Req() req: any) {
    this.assertSuperAdmin(req);
    return { categories: Object.values(AuditCategory) };
  }
}
