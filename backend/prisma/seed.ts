import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * There is deliberately no hardcoded fallback password anywhere in this
 * file. Every previous default here (superadmin@leinaflow.com /
 * SuperAdmin2026!, admin@soflow.local / ChangeMeNow123!, and a stray
 * "admin" / "1234" account) was committed to source control and must be
 * treated as compromised — see docs/architecture/ip-tracking.md's sibling
 * security-gap report. Seeding a privileged account now always requires an
 * explicit secret from the environment; a missing one fails the seed
 * loudly instead of silently creating (or worse, resetting) an account
 * with a value anyone who has ever cloned this repo could guess.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `${name} is not set. Seeding a privileged account requires an explicit secret from the ` +
        `environment — there is no default credential. Set ${name} in .env/.env.development ` +
        '(see .env.development.example) and re-run `npm run prisma:seed`.',
    );
  }
  return value;
}

/**
 * The platform's SUPER_ADMIN. Required for the app to be usable at all (the
 * System admin pages, workspace approval, etc. all gate on this role), so
 * unlike the dev convenience account below this one is not optional — but
 * it is only ever CREATED here, never re-passworded. An account that
 * already exists is left untouched: re-running the seed can't be used to
 * silently rotate a live credential, and rotating an already-compromised
 * one is a separate, deliberate operational action (see
 * docs/architecture/ip-tracking.md's sibling report for the Demo rotation
 * steps this does not perform).
 */
async function seedSuperAdmin() {
  const email = requireEnv('SEED_SUPER_ADMIN_EMAIL').trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('SUPER_ADMIN already exists:', email);
    return existing;
  }

  const password = requireEnv('SEED_SUPER_ADMIN_PASSWORD');
  const passwordHash = await bcrypt.hash(password, 10);
  const superAdmin = await prisma.user.create({
    data: {
      email,
      username: process.env.SEED_SUPER_ADMIN_USERNAME?.trim() || 'superadmin',
      passwordHash,
      name: 'Platform Admin',
      isCreator: false,
      role: Role.SUPER_ADMIN,
    },
  });
  // Never log `password` or `passwordHash` — only the fact that the account was created.
  console.log('SUPER_ADMIN created:', superAdmin.email);
  return superAdmin;
}

/**
 * Optional dev-convenience account (an ordinary workspace member, not
 * privileged) for exercising the app without the SUPER_ADMIN. Unlike
 * SUPER_ADMIN this is entirely opt-in: if either var is unset, it's simply
 * skipped rather than failing the seed — a developer who only needs the
 * platform admin shouldn't be forced to also provision a second account.
 */
async function seedDevUser() {
  const email = process.env.SEED_DEV_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_DEV_USER_PASSWORD;
  if (!email || !password) {
    console.log('SEED_DEV_USER_EMAIL/SEED_DEV_USER_PASSWORD not set — skipping optional dev user.');
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Dev user already exists:', email);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      username: process.env.SEED_DEV_USER_USERNAME?.trim() || 'devuser',
      passwordHash,
      name: 'Dev User',
      isCreator: false,
    },
  });
  console.log('Dev user created:', user.email);
  return user;
}

async function main() {
  const superAdmin = await seedSuperAdmin();
  const devUser = await seedDevUser();

  // Workspace-scoped features (e.g. the Media Library) need every seeded
  // user to belong to at least one workspace; nothing else creates one yet.
  const defaultWorkspaceSlug = 'default';
  let workspace = await prisma.workspace.findUnique({ where: { slug: defaultWorkspaceSlug } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: 'Default Workspace', slug: defaultWorkspaceSlug },
    });
    console.log('Workspace created:', workspace.slug);
  } else {
    console.log('Workspace already exists:', workspace.slug);
  }

  for (const user of [superAdmin, devUser]) {
    if (!user) continue;
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });
    if (!existingMembership) {
      await prisma.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: user.role === Role.SUPER_ADMIN ? 'OWNER' : 'USER' },
      });
      console.log('Workspace membership created for:', user.email);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
