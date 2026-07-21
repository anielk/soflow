import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfigService } from './service-config.service';

// @Global() so ServiceConfigService — the one place every module reads
// external-service connection info from — is injectable anywhere without
// each feature module having to import this one, matching the pattern
// PrismaModule/RedisModule already use.
@Global()
@Module({
  providers: [ConfigService, ServiceConfigService],
  exports: [ConfigService, ServiceConfigService],
})
export class ConfigModule {}