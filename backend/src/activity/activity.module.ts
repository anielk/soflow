import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from './activity.service';
import { ActivityEventListener } from './activity-event.listener';
import { ActivityController } from './activity.controller';

@Module({
  controllers: [ActivityController],
  providers: [PrismaService, ActivityService, ActivityEventListener],
  exports: [ActivityService],
})
export class ActivityModule {}
