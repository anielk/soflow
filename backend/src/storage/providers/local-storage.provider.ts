import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { StorageProvider } from '../storage.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(private readonly configService: ConfigService) {
    this.root = this.configService.get<string>('MEDIA_STORAGE_PATH', '/data/media');
  }

  resolveAbsolutePath(key: string): string {
    return path.join(this.root, key);
  }

  async save(key: string, sourcePath: string): Promise<void> {
    const destination = this.resolveAbsolutePath(key);
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    try {
      await fsp.rename(sourcePath, destination);
    } catch (err: any) {
      // sourcePath and destination can end up on different filesystems
      // depending on config; fall back to copy+unlink instead of failing.
      if (err.code === 'EXDEV') {
        await fsp.copyFile(sourcePath, destination);
        await fsp.unlink(sourcePath);
      } else {
        throw err;
      }
    }
  }

  async saveBuffer(key: string, data: Buffer): Promise<void> {
    const destination = this.resolveAbsolutePath(key);
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await fsp.writeFile(destination, data);
  }

  async getReadStream(key: string): Promise<Readable> {
    return fs.createReadStream(this.resolveAbsolutePath(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fsp.unlink(this.resolveAbsolutePath(key));
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fsp.access(this.resolveAbsolutePath(key));
      return true;
    } catch {
      return false;
    }
  }
}
