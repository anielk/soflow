import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async checkHealth(@Res({ passthrough: true }) res: Response) {
    const report = await this.healthService.check();
    res.status(report.status === 'down' ? 503 : 200);
    return report;
  }
}
