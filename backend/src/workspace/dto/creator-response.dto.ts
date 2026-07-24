import { Creator, CreatorStatus } from '@prisma/client';

/** Never the raw Prisma row — workspaceId is deliberately omitted (the caller already knows their own workspace). */
export class CreatorResponseDto {
  id!: string;
  name!: string;
  email!: string | null;
  phone!: string | null;
  bio!: string | null;
  notes!: string | null;
  tags!: string[];
  avatarUrl!: string | null;
  status!: CreatorStatus;
  createdAt!: Date;
  updatedAt!: Date;
}

export function toCreatorResponse(creator: Creator): CreatorResponseDto {
  return {
    id: creator.id,
    name: creator.name,
    email: creator.email,
    phone: creator.phone,
    bio: creator.bio,
    notes: creator.notes,
    tags: creator.tags,
    avatarUrl: creator.avatarUrl,
    status: creator.status,
    createdAt: creator.createdAt,
    updatedAt: creator.updatedAt,
  };
}

export interface CreatorStatsDto {
  mediaCount: number;
  imageCount: number;
  videoCount: number;
  documentCount: number;
  storageBytes: number;
}
