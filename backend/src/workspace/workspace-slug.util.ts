import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

/**
 * Shared by AuthService.register (the default workspace created at signup)
 * and WorkspaceService.create (self-service additional workspaces) — both
 * need the exact same slugify-and-dedupe behavior, so this lives outside
 * either service rather than being duplicated.
 */
export async function uniqueWorkspaceSlug(tx: Prisma.TransactionClient, seed: string): Promise<string> {
  const base = seed.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 40) || 'workspace';
  let candidate = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await tx.workspace.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${base}-${randomBytes(2).toString('hex')}`;
  }
  throw new ConflictException('Could not generate a unique workspace name — please try a different one.');
}
