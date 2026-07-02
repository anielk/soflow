import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.interface';
import { StorageService } from './storage.service';
import { LocalStorageProvider } from './providers/local-storage.provider';

/**
 * Wires MEDIA_STORAGE_DRIVER to a concrete StorageProvider. Only "local" is
 * implemented today. Adding minio/s3/azure/gcs later is a new provider class
 * plus one new case here — no other module needs to change.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService, localStorageProvider: LocalStorageProvider) => {
        const driver = configService.get<string>('MEDIA_STORAGE_DRIVER', 'local');
        switch (driver) {
          case 'local':
            return localStorageProvider;
          default:
            throw new Error(
              `Storage driver "${driver}" is not implemented. Add a StorageProvider for it and wire it into StorageModule's factory.`,
            );
        }
      },
      inject: [ConfigService, LocalStorageProvider],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
