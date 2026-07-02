import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { MediaType } from '@prisma/client';

export interface ThumbnailResult {
  small: Buffer;
  medium: Buffer;
  width: number | null;
  height: number | null;
  duration: number | null;
}

const SMALL_WIDTH = 240;
const MEDIUM_WIDTH = 640;

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  /** Never throws — thumbnail generation is best-effort and non-fatal to the upload. */
  async generate(type: MediaType, absoluteFilePath: string): Promise<ThumbnailResult | null> {
    try {
      return type === MediaType.IMAGE
        ? await this.generateForImage(absoluteFilePath)
        : await this.generateForVideo(absoluteFilePath);
    } catch (err) {
      this.logger.warn(`Thumbnail generation failed for ${absoluteFilePath}: ${err}`);
      return null;
    }
  }

  private async generateForImage(absoluteFilePath: string): Promise<ThumbnailResult> {
    const metadata = await sharp(absoluteFilePath).metadata();
    const [small, medium] = await Promise.all([
      this.resize(absoluteFilePath, SMALL_WIDTH, 80),
      this.resize(absoluteFilePath, MEDIUM_WIDTH, 85),
    ]);
    return { small, medium, width: metadata.width ?? null, height: metadata.height ?? null, duration: null };
  }

  private async generateForVideo(absoluteFilePath: string): Promise<ThumbnailResult> {
    const probe = await this.probe(absoluteFilePath);
    // A single extracted JPEG frame is tiny — fine to stage on the (RAM-backed)
    // tmpfs /tmp, unlike the multi-GB source uploads which must not touch it.
    const framePath = path.join(os.tmpdir(), `frame-${randomUUID()}.jpg`);
    await this.extractFrame(absoluteFilePath, framePath);
    try {
      const [small, medium] = await Promise.all([
        this.resize(framePath, SMALL_WIDTH, 80),
        this.resize(framePath, MEDIUM_WIDTH, 85),
      ]);
      return { small, medium, width: probe.width, height: probe.height, duration: probe.duration };
    } finally {
      await fs.unlink(framePath).catch(() => undefined);
    }
  }

  private resize(sourcePath: string, width: number, quality: number): Promise<Buffer> {
    return sharp(sourcePath).resize({ width, withoutEnlargement: true }).jpeg({ quality }).toBuffer();
  }

  private probe(
    absoluteFilePath: string,
  ): Promise<{ width: number | null; height: number | null; duration: number | null }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(absoluteFilePath, (err, data) => {
        if (err) return reject(err);
        const videoStream = data.streams.find((s) => s.codec_type === 'video');
        resolve({
          width: videoStream?.width ?? null,
          height: videoStream?.height ?? null,
          duration: data.format.duration ? Number(data.format.duration) : null,
        });
      });
    });
  }

  private extractFrame(absoluteFilePath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(absoluteFilePath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .screenshots({
          timestamps: ['0'],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
        });
    });
  }
}
