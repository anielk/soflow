import { Readable } from 'stream';

/**
 * Every storage backend (local disk, NAS, MinIO, S3, Azure Blob, GCS, ...)
 * implements this same contract. Nothing outside this module should ever
 * import a concrete provider directly — always depend on StorageService.
 */
export interface StorageProvider {
  /** Move the file currently at sourcePath (a local temp path) into permanent storage under `key`. */
  save(key: string, sourcePath: string): Promise<void>;
  /** Store in-memory data (e.g. a generated thumbnail) under `key`. */
  saveBuffer(key: string, data: Buffer): Promise<void>;
  getReadStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Local-disk convenience for tools (sharp/ffmpeg) that need a real filesystem path. */
  resolveAbsolutePath(key: string): string;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
