import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async checkHealth() {
    try {
      // Test PostgreSQL connection
      await this.prismaService.$queryRaw`SELECT 1`;
      const postgresStatus = 'OK';
      
      // Test Redis connection
      const redisStatus = await this.redisService.ping();
      
      return {
        status: 'OK',
        postgres: postgresStatus,
        redis: redisStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        status: 'ERROR',
        postgres: 'ERROR',
        redis: 'ERROR',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }
}