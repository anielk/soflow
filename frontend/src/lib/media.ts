import { apiUrl, authHeaders, parseUploadErrorMessage, throwOnError } from './api';
import { getAuthToken } from './auth';
import type { MediaFileStatus, MediaItem, MediaType } from '@/types/workspace';

interface RawMedia {
  id: string;
  workspaceId: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
  creatorId: string | null;
  filename: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  status: 'PROCESSING' | 'READY' | 'FAILED';
  hasThumbnail: boolean;
  createdAt: string;
  updatedAt: string;
}

const TYPE_FROM_API: Record<RawMedia['type'], MediaType> = { IMAGE: 'image', VIDEO: 'video', DOCUMENT: 'document' };
const TYPE_TO_API: Record<MediaType, RawMedia['type']> = { image: 'IMAGE', video: 'VIDEO', document: 'DOCUMENT' };

function mapMedia(raw: RawMedia): MediaItem {
  return {
    id: raw.id,
    workspaceId: raw.workspaceId,
    ownerId: raw.ownerId,
    ownerName: raw.ownerName ?? raw.ownerEmail,
    creatorId: raw.creatorId,
    filename: raw.filename,
    originalFilename: raw.originalFilename,
    mimeType: raw.mimeType,
    extension: raw.extension,
    sizeBytes: Number(raw.sizeBytes),
    width: raw.width,
    height: raw.height,
    duration: raw.duration,
    type: TYPE_FROM_API[raw.type],
    status: raw.status.toLowerCase() as MediaFileStatus,
    hasThumbnail: raw.hasThumbnail,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export interface ListMediaParams {
  search?: string;
  type?: MediaType;
  /** Scope to one creator's media library. Omit for the workspace's general library. */
  creatorId?: string;
  sortBy?: 'createdAt' | 'filename' | 'sizeBytes';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListMediaResult {
  items: MediaItem[];
  total: number;
  page: number;
  limit: number;
}

export async function listMedia(params: ListMediaParams = {}): Promise<ListMediaResult> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.type) query.set('type', TYPE_TO_API[params.type]);
  if (params.creatorId) query.set('creatorId', params.creatorId);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const response = await fetch(apiUrl(`/media?${query.toString()}`), {
    headers: authHeaders(),
    cache: 'no-store',
  });
  await throwOnError(response, 'Failed to load media library');
  const data = (await response.json()) as { items: RawMedia[]; total: number; page: number; limit: number };
  return { items: data.items.map(mapMedia), total: data.total, page: data.page, limit: data.limit };
}

export async function renameMedia(id: string, originalFilename: string): Promise<MediaItem> {
  const response = await fetch(apiUrl(`/media/${id}`), {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalFilename }),
  });
  await throwOnError(response, 'Failed to rename file');
  return mapMedia(await response.json());
}

export async function deleteMedia(id: string): Promise<void> {
  const response = await fetch(apiUrl(`/media/${id}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await throwOnError(response, 'Failed to delete file');
}

export function getMediaFileUrl(id: string): string {
  return apiUrl(`/media/${id}/file`);
}

export function getMediaThumbnailUrl(id: string, size: 'small' | 'medium' = 'small'): string {
  return apiUrl(`/media/${id}/thumbnail?size=${size}`);
}

/**
 * <img>/<video> tags can't send an Authorization header, and this project has
 * no signed-URL infra — so previews/thumbnails are fetched authed and turned
 * into object URLs. Callers must revoke the returned URL when done with it.
 */
export async function fetchMediaBlobUrl(
  id: string,
  variant: 'file' | 'thumbnail',
  size: 'small' | 'medium' = 'small',
): Promise<string> {
  const url = variant === 'file' ? getMediaFileUrl(id) : getMediaThumbnailUrl(id, size);
  const response = await fetch(url, { headers: authHeaders() });
  await throwOnError(response, 'Failed to load media asset');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  /** Attach the upload to a specific creator's media library instead of the general workspace library. */
  creatorId?: string;
}

export function uploadMedia(file: File, options: UploadOptions = {}): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    if (options.creatorId) formData.append('creatorId', options.creatorId);

    xhr.open('POST', apiUrl('/media/upload'));
    const token = getAuthToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(mapMedia(JSON.parse(xhr.responseText)));
        } catch {
          reject(new Error('Failed to parse upload response'));
        }
        return;
      }
      reject(new Error(parseUploadErrorMessage(xhr.responseText, `Upload failed (${xhr.status})`)));
    };

    xhr.onerror = () => reject(new Error('Upload failed — network error'));
    xhr.onabort = () => reject(new DOMException('Upload canceled', 'AbortError'));

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return;
      }
      options.signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(formData);
  });
}
