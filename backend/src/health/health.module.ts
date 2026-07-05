import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationModule } from '../notification/notification.module';

// PrismaService/RedisService are provided globally (PrismaModule/RedisModule
// are both @Global()) — no need to import or re-provide them here.
@Module({
  imports: [StorageModule, NotificationModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
