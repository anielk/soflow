import { apiUrl, authHeaders, throwOnError } from './api';
import type { Post, PostType, PostStatus } from '@/types/workspace';

interface RawPost {
  id: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  caption: string | null;
  type: 'FREE' | 'PPV';
  price: number | null;
  status: 'DRAFT' | 'SCHEDULED';
  scheduledAt: string | null;
  mediaIds: string[];
  createdAt: string;
  updatedAt: string;
}

const TYPE_FROM_API: Record<RawPost['type'], PostType> = { FREE: 'free', PPV: 'ppv' };
const TYPE_TO_API: Record<PostType, RawPost['type']> = { free: 'FREE', ppv: 'PPV' };
const STATUS_FROM_API: Record<RawPost['status'], PostStatus> = { DRAFT: 'draft', SCHEDULED: 'scheduled' };

function mapPost(raw: RawPost): Post {
  return {
    id: raw.id,
    caption: raw.caption ?? '',
    type: TYPE_FROM_API[raw.type],
    status: STATUS_FROM_API[raw.status],
    price: raw.price ?? undefined,
    scheduledAt: raw.scheduledAt ?? undefined,
    mediaIds: raw.mediaIds,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export interface SavePostInput {
  caption?: string;
  type?: PostType;
  price?: number;
  /** Omit (or pass undefined) to save as a draft; pass an ISO date-time to schedule it. */
  scheduledAt?: string;
  mediaIds?: string[];
}

export async function listPosts(status?: PostStatus): Promise<Post[]> {
  const query = status ? `?status=${status === 'draft' ? 'DRAFT' : 'SCHEDULED'}` : '';
  const response = await fetch(apiUrl(`/posts${query}`), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load posts');
  const data = (await response.json()) as RawPost[];
  return data.map(mapPost);
}

export async function getPost(id: string): Promise<Post> {
  const response = await fetch(apiUrl(`/posts/${id}`), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load post');
  return mapPost(await response.json());
}

export async function createPost(input: SavePostInput): Promise<Post> {
  const response = await fetch(apiUrl('/posts'), {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caption: input.caption,
      type: input.type ? TYPE_TO_API[input.type] : undefined,
      price: input.price,
      scheduledAt: input.scheduledAt,
      mediaIds: input.mediaIds,
    }),
  });
  await throwOnError(response, 'Failed to create post');
  return mapPost(await response.json());
}

export async function updatePost(id: string, input: SavePostInput & { scheduledAt?: string | null }): Promise<Post> {
  const response = await fetch(apiUrl(`/posts/${id}`), {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caption: input.caption,
      type: input.type ? TYPE_TO_API[input.type] : undefined,
      price: input.price,
      scheduledAt: input.scheduledAt,
      mediaIds: input.mediaIds,
    }),
  });
  await throwOnError(response, 'Failed to update post');
  return mapPost(await response.json());
}

export async function deletePost(id: string): Promise<void> {
  const response = await fetch(apiUrl(`/posts/${id}`), { method: 'DELETE', headers: authHeaders() });
  await throwOnError(response, 'Failed to delete post');
}
