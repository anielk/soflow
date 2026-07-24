import { CreatorProfile, User } from '@prisma/client';

/**
 * The public, unauthenticated `/creators/:username` page — never the raw
 * Prisma User row. CreatorProfile fields (name/bio/avatarUrl/website/
 * socialLinks) are flattened the same way ProfileResponseDto does for the
 * account owner's own view, since that's the actual source of truth once a
 * user has filled in their public profile; the bare User columns are only
 * the fallback for an account that hasn't done that yet.
 */
export class PublicCreatorProfileDto {
  id!: string;
  email!: string;
  name!: string | null;
  bio!: string | null;
  avatarUrl!: string | null;
  website!: string | null;
  socialLinks!: Record<string, string>;
}

export function toPublicCreatorProfile(user: User & { creatorProfile: CreatorProfile | null }): PublicCreatorProfileDto {
  return {
    id: user.id,
    email: user.email,
    name: user.creatorProfile?.name ?? user.name,
    bio: user.creatorProfile?.bio ?? user.bio,
    avatarUrl: user.creatorProfile?.avatarUrl ?? user.avatarUrl,
    website: user.creatorProfile?.website ?? null,
    socialLinks: (user.creatorProfile?.socialLinks as Record<string, string>) ?? {},
  };
}
