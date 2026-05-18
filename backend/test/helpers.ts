import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export async function createApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MailService)
    .useValue({ sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() })
    .compile();

  const app = moduleFixture.createNestApplication();
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

export async function cleanDb(prisma: PrismaService): Promise<void> {
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookDestination.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.teamProject.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.systemSettings.deleteMany();
}

export async function createAdminToken(prisma: PrismaService): Promise<{ token: string; userId: string }> {
  const hash = await bcrypt.hash('Admin@123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'admin@test.com',
      passwordHash: hash,
      role: 'admin',
      emailVerifiedAt: new Date(),
    },
  });
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env['JWT_SECRET'] ?? 'test-secret',
    { expiresIn: '1h' },
  );
  return { token, userId: user.id };
}

export async function createUserToken(
  prisma: PrismaService,
  role: 'manager' | 'member',
  email?: string,
): Promise<{ token: string; userId: string }> {
  const hash = await bcrypt.hash('User@123', 10);
  const user = await prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: email ?? `${role}@test.com`,
      passwordHash: hash,
      role,
      emailVerifiedAt: new Date(),
    },
  });
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env['JWT_SECRET'] ?? 'test-secret',
    { expiresIn: '1h' },
  );
  return { token, userId: user.id };
}
