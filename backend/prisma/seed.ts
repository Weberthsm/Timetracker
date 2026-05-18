import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminName || !adminPassword) {
    throw new Error('ADMIN_EMAIL, ADMIN_NAME e ADMIN_PASSWORD devem estar definidos no .env');
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Admin criado: ${adminEmail}`);
  } else {
    console.log(`Admin já existe: ${adminEmail}`);
  }

  const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.systemSettings.create({
      data: { id: 1, requireEmailVerification: true },
    });
    console.log('SystemSettings criado com padrões.');
  } else {
    console.log('SystemSettings já existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
