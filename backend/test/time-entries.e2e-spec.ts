import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, cleanDb, createAdminToken, createUserToken } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TimeEntries + Reports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminId: string;
  let memberToken: string;
  let memberId: string;
  let projectId: string;
  let teamId: string;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDb(prisma);
    await prisma.systemSettings.create({ data: { id: 1, requireEmailVerification: false } });

    const admin = await createAdminToken(prisma);
    adminToken = admin.token;
    adminId = admin.userId;

    const member = await createUserToken(prisma, 'member', 'member@test.com');
    memberToken = member.token;
    memberId = member.userId;

    const team = await prisma.team.create({ data: { name: 'Dev Team' } });
    teamId = team.id;
    await prisma.user.update({ where: { id: memberId }, data: { teamId } });

    const project = await prisma.project.create({
      data: { name: 'Test Project', status: 'active', color: '#3b82f6' },
    });
    projectId = project.id;
    await prisma.teamProject.create({ data: { teamId, projectId } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /time-entries/start → 201 (timer ativo)', async () => {
    const res = await request(app.getHttpServer())
      .post('/time-entries/start')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId });
    expect(res.status).toBe(201);
    expect(res.body.data.endedAt).toBeNull();
  });

  it('GET /time-entries/active → retorna timer ativo', async () => {
    await request(app.getHttpServer())
      .post('/time-entries/start')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId });

    const res = await request(app.getHttpServer())
      .get('/time-entries/active')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.endedAt).toBeNull();
  });

  it('POST /time-entries/start duas vezes → 422', async () => {
    await request(app.getHttpServer())
      .post('/time-entries/start')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId });

    const res = await request(app.getHttpServer())
      .post('/time-entries/start')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId });
    expect(res.status).toBe(422);
  });

  it('PATCH /time-entries/:id/stop → 200 + duration calculada', async () => {
    const startRes = await request(app.getHttpServer())
      .post('/time-entries/start')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId });

    const entryId = startRes.body.data.id;
    const stopRes = await request(app.getHttpServer())
      .patch(`/time-entries/${entryId}/stop`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(stopRes.status).toBe(200);
    expect(stopRes.body.data.duration).toBeGreaterThanOrEqual(0);
    expect(stopRes.body.data.endedAt).toBeDefined();
  });

  it('POST /time-entries (manual) → 201', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app.getHttpServer())
      .post('/time-entries')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId,
        date: today,
        startedAt: `${today}T09:00:00Z`,
        endedAt: `${today}T11:00:00Z`,
        description: 'Trabalho manual',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.duration).toBe(7200);
  });

  it('GET /reports/daily?date=today → 200 com totais', async () => {
    const today = new Date().toISOString().split('T')[0];
    await request(app.getHttpServer())
      .post('/time-entries')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId,
        date: today,
        startedAt: `${today}T09:00:00Z`,
        endedAt: `${today}T11:00:00Z`,
      });

    const res = await request(app.getHttpServer())
      .get(`/reports/daily?date=${today}&userId=${memberId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalSeconds).toBe(7200);
  });

  it('Member tenta acessar relatório de outro → 403', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app.getHttpServer())
      .get(`/reports/daily?date=${today}&userId=${adminId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });
});
