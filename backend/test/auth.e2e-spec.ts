import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as crypto from 'crypto';
import { createApp, cleanDb } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDb(prisma);
    await prisma.systemSettings.create({ data: { id: 1, requireEmailVerification: true } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'João', email: 'joao@test.com', password: 'Senha@123' });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('joao@test.com');
  });

  it('GET /auth/me sem token → 401', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /auth/login sem verificar e-mail → 403', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Maria', email: 'maria@test.com', password: 'Senha@123' });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'maria@test.com', password: 'Senha@123' });
    expect(res.status).toBe(403);
  });

  it('fluxo completo: register → verify → login → me', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Pedro', email: 'pedro@test.com', password: 'Senha@123' });

    // Token raw is not stored — insert a known raw token manually
    const user = await prisma.user.findUnique({ where: { email: 'pedro@test.com' } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user!.id } });
    const rawToken = 'testtoken123abc';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.emailVerificationToken.create({
      data: {
        userId: user!.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    const verifyRes = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: rawToken });
    expect(verifyRes.status).toBe(200);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'pedro@test.com', password: 'Senha@123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('pedro@test.com');
  });

  it('POST /auth/forgot-password → 200', async () => {
    await prisma.user.create({
      data: {
        name: 'Ana',
        email: 'ana@test.com',
        passwordHash: 'x',
        role: 'member',
        emailVerifiedAt: new Date(),
      },
    });
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'ana@test.com' });
    expect(res.status).toBe(200);
  });

  it('reset-password: inserir token + resetar senha + login com nova senha', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Bob',
        email: 'bob@test.com',
        passwordHash: 'oldhash',
        role: 'member',
        emailVerifiedAt: new Date(),
      },
    });
    const rawToken = 'resettoken456xyz';
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashed,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });

    const resetRes = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: rawToken, newPassword: 'NovaSenha@456' });
    expect(resetRes.status).toBe(200);

    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    await prisma.systemSettings.updateMany({ data: { requireEmailVerification: false } });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bob@test.com', password: 'NovaSenha@456' });
    expect(loginRes.status).toBe(200);
  });
});
