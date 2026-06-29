import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });