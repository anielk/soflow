import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationModule } from '../notification/notification.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [
    StorageModule,
    NotificationModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storagePath = configService.get<string>('MEDIA_STORAGE_PATH', '/data/media');
        // Same staging volume as MediaModule (not /tmp — tmpfs in these
        // containers), just its own small limit: a logo isn't a media asset.
        const tmpDir = path.join(storagePath, '.tmp');
        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              fs.mkdir(tmpDir, { recursive: true }, (err) => cb(err, tmpDir));
            },
            filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
          }),
          limits: { fileSize: 5 * 1024 * 1024 },
        };
      },
    }),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, PrismaService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
