import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { ServiceConfigService } from './config/service-config.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { CreatorsModule } from './creators/creators.module';
import { MediaModule } from './media/media.module';
import { PostsModule } from './posts/posts.module';
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
    AppConfigModule,
    // A rolling per-IP window (see ServiceConfigService.rateLimit()), applied
    // globally via the APP_GUARD below. Replaces a hand-rolled Express
    // middleware that used to count requests forever with no reset — see
    // docs/architecture/rate-limiting.md.
    ThrottlerModule.forRootAsync({
      useFactory: (serviceConfig: ServiceConfigService) => {
        const { ttlMs, max } = serviceConfig.rateLimit();
        return [{ ttl: ttlMs, limit: max }];
      },
      inject: [ServiceConfigService],
    }),
    PrismaModule,
    RedisModule,
    EventsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WebsocketModule,
    DashboardModule,
    CreatorsModule,
    MediaModule,
    PostsModule,
    WorkspaceModule,
    NotificationModule,
    AuditModule,
    ActivityModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
