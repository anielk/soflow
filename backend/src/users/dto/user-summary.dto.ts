import { Role, User } from '@prisma/client';

/**
 * Every field an admin listing or an auth response is allowed to expose.
 * Deliberately excludes passwordHash, resetTokenHash, and resetTokenExpiresAt
 * — see toUserSummary(), the one place a Prisma User is turned into this.
 */
export class UserSummaryDto {
  id!: string;
  email!: string;
  username!: string;
  name!: string | null;
  role!: Role;
  isCreator!: boolean;
  createdAt!: Date;
}

export function toUserSummary(user: User): UserSummaryDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    isCreator: user.isCreator,
    createdAt: user.createdAt,
  };
}
