import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as http from 'http';
import { createApp, cleanDb, createAdminToken, createUserToken } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

function startMockServer(): Promise<{ server: http.Server; port: number; received: any[] }> {
  const received: any[] = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      received.push({ headers: req.headers, body: JSON.parse(body || '{}') });
      res.writeHead(200);
      res.end('ok');
    });
  });
  return new Promise((resolve) => {
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      resolve({ server, port, received });
    });
  });
}

describe('Webhooks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDb(prisma);
    await prisma.systemSettings.create({ data: { id: 1, requireEmailVerification: false } });
    const admin = await createAdminToken(prisma);
    adminToken = admin.token;
    const member = await createUserToken(prisma, 'member');
    memberToken = member.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /webhooks → 201 (admin cria webhook)', async () => {
    const res = await request(app.getHttpServer())
      .post('/webhooks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Hook', url: 'http://localhost:9999/hook', events: ['timer.stopped'] });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Hook');
  });

  it('POST /webhooks → 403 para não-admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/webhooks')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hook', url: 'http://localhost:9999/hook', events: ['timer.stopped'] });
    expect(res.status).toBe(403);
  });

  it('POST /webhooks/:id/test → envia payload e registra entrega', async () => {
    const { server, port, received } = await startMockServer();

    const createRes = await request(app.getHttpServer())
      .post('/webhooks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Local Hook', url: `http://localhost:${port}/hook`, events: ['timer.stopped'] });
    const webhookId = createRes.body.data.id;

    const testRes = await request(app.getHttpServer())
      .post(`/webhooks/${webhookId}/test`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(testRes.status).toBe(200);
    expect(testRes.body.data.success).toBe(true);

    const deliveriesRes = await request(app.getHttpServer())
      .get(`/webhooks/${webhookId}/deliveries`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deliveriesRes.status).toBe(200);
    expect(deliveriesRes.body.data.length).toBeGreaterThanOrEqual(1);

    expect(received.length).toBeGreaterThanOrEqual(1);
    server.close();
  });
});
