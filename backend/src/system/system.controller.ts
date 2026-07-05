import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemService } from './system.service';

@UseGuards(JwtAuthGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  private assertSuperAdmin(req: any): void {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can view system information.');
    }
  }

  @Get('version')
  getVersion(@Req() req: any) {
    this.assertSuperAdmin(req);
    return this.systemService.getVersion();
  }

  @Get('environment')
  getEnvironment(@Req() req: any) {
    this.assertSuperAdmin(req);
    return this.systemService.getEnvironment();
  }

  @Get('modules')
  getModules(@Req() req: any) {
    this.assertSuperAdmin(req);
    return { modules: this.systemService.getInstalledModules() };
  }
}
