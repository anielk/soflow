import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── SUPER_ADMIN platform user ─────────────────────────────────────────────
  const superAdminEmail = 'superadmin@leinaflow.com';
  const superAdminPassword = 'SuperAdmin2026!';
  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existingSuperAdmin) {
    const hashedSuper = await bcrypt.hash(superAdminPassword, 10);
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        username: 'superadmin',
        passwordHash: hashedSuper,
        name: 'Platform Admin',
        isCreator: false,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('SUPER_ADMIN created:', superAdmin.email);
  } else {
    console.log('SUPER_ADMIN already exists:', superAdminEmail);
  }

  // ── Existing workspace admin user ─────────────────────────────────────────
  const adminEmail = 'admin@soflow.local';
  const adminPassword = 'ChangeMeNow123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail);
  } else {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        passwordHash: hashedPassword,
        name: 'Admin',
        isCreator: false,
      },
    });
    console.log('Admin user created:', admin.email);
  }

  const regularUserEmail = 'admin';
  const regularUserPassword = '1234';
  const existingRegular = await prisma.user.findUnique({
    where: { email: regularUserEmail },
  });

  if (!existingRegular) {
    const hashedReg = await bcrypt.hash(regularUserPassword, 10);
    const reg = await prisma.user.create({
      data: {
        email: regularUserEmail,
        username: 'admin_user',
        passwordHash: hashedReg,
        name: 'Admin',
        isCreator: false,
      },
    });
    console.log('Regular user created:', reg.email);
  } else {
    console.log('Regular user already exists:', regularUserEmail);
  }

  // ── Default workspace ──────────────────────────────────────────────────────
  // Workspace-scoped features (e.g. the Media Library) need every seeded user
  // to belong to at least one workspace; nothing else creates one yet.
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

  for (const email of [superAdminEmail, adminEmail, regularUserEmail]) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });
    if (!existingMembership) {
      await prisma.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: user.role === 'SUPER_ADMIN' ? 'OWNER' : 'USER' },
      });
      console.log('Workspace membership created for:', email);
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