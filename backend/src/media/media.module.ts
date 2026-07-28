import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { ThumbnailService } from './thumbnail.service';

@Module({
  imports: [
    StorageModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storagePath = configService.get<string>('MEDIA_STORAGE_PATH', '/data/media');
        const maxFileSizeMb = configService.get<number>('MEDIA_MAX_FILE_SIZE_MB', 2048);
        // Staging uploads on the same volume as final storage (not /tmp,
        // which is RAM-backed tmpfs in this project's containers) keeps
        // large-file handling off the heap and makes the final move a cheap
        // same-filesystem rename.
        const tmpDir = path.join(storagePath, '.tmp');
        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              fs.mkdir(tmpDir, { recursive: true }, (err) => cb(err, tmpDir));
            },
            filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
          }),
          // Hard technical ceiling — enforced here, not by a reverse proxy
          // (no infrastructure component in front of this app is assumed or
          // relied on for request-size limits; see
          // docs/deployment/Architecture.md). This is a backstop above the
          // largest plan limit, not the real business-facing cap: Multer's
          // options are fixed at bootstrap, so they can't vary per workspace.
          // The actual per-plan limit (see MediaService.assertWithinUploadLimit
          // and media/upload-limits.ts) is checked afterwards, once the
          // uploading workspace is known.
          limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
        };
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, ThumbnailService, PrismaService],
  exports: [MediaService],
})
export class MediaModule {}
