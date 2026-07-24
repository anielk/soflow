import { CreatorProfile, User } from '@prisma/client';

/**
 * The logged-in user's own profile — never includes passwordHash or the
 * reset-token fields. Also the one place CreatorProfile fields (name/bio/
 * avatarUrl/website/socialLinks) are flattened onto the response, since the
 * frontend (creator/edit) reads them at the top level, not under a nested
 * `creatorProfile` key. User-level name/bio/avatarUrl are the fallback for
 * an account that hasn't created a CreatorProfile row yet.
 */
export class ProfileResponseDto {
  id!: string;
  email!: string;
  username!: string;
  role!: string;
  isCreator!: boolean;
  name!: string | null;
  bio!: string | null;
  avatarUrl!: string | null;
  bannerUrl!: string | null;
  website!: string | null;
  socialLinks!: Record<string, string>;
  createdAt!: Date;
}

export function toProfileResponse(user: User & { creatorProfile: CreatorProfile | null }): ProfileResponseDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isCreator: user.isCreator,
    name: user.creatorProfile?.name ?? user.name,
    bio: user.creatorProfile?.bio ?? user.bio,
    avatarUrl: user.creatorProfile?.avatarUrl ?? user.avatarUrl,
    bannerUrl: user.bannerUrl,
    website: user.creatorProfile?.website ?? null,
    socialLinks: (user.creatorProfile?.socialLinks as Record<string, string>) ?? {},
    createdAt: user.createdAt,
  };
}
