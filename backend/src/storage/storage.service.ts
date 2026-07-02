import { Inject, Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { STORAGE_PROVIDER, StorageProvider } from './storage.interface';

/**
 * Facade the rest of the app depends on. Delegates to whichever
 * StorageProvider StorageModule bound to STORAGE_PROVIDER — callers never
 * know or care whether that's local disk, MinIO, S3, Azure, or GCS.
 */
@Injectable()
export class StorageService implements StorageProvider {
  constructor(@Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider) {}

  save(key: string, sourcePath: string): Promise<void> {
    return this.provider.save(key, sourcePath);
  }

  saveBuffer(key: string, data: Buffer): Promise<void> {
    return this.provider.saveBuffer(key, data);
  }

  getReadStream(key: string): Promise<Readable> {
    return this.provider.getReadStream(key);
  }

  delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  resolveAbsolutePath(key: string): string {
    return this.provider.resolveAbsolutePath(key);
  }
}
