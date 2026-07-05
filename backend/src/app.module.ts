import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CreatorsModule } from './creators/creators.module';
import { MediaModule } from './media/media.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { NotificationModule } from './notification/notification.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './audit/audit.module';
import { ActivityModule } from './activity/activity.module';
import { SystemModule } from './system/system.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    RedisModule,
    EventsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WebsocketModule,
    AppConfigModule,
    DashboardModule,
    CreatorsModule,
    MediaModule,
    WorkspaceModule,
    NotificationModule,
    AuditModule,
    ActivityModule,
    SystemModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
