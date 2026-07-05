import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  private assertSuperAdmin(req: any): void {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can view audit logs.');
    }
  }

  @Get()
  findMany(@Query() query: QueryAuditLogDto, @Req() req: any) {
    this.assertSuperAdmin(req);
    return this.auditService.findMany({
      workspaceId: query.workspaceId,
      userId: query.userId,
      category: query.category,
      eventType: query.eventType,
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
