import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { WebhooksDispatcher } from './webhooks.dispatcher';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createHmac } from 'crypto';

const admin = { userId: 'a1', email: 'a@t.com', role: 'admin' };
const manager = { userId: 'm1', email: 'm@t.com', role: 'manager' };

const mockDestination = (overrides: Record<string, unknown> = {}) => ({
  id: 'w1',
  url: 'https://example.com/hook',
  secret: null,
  isActive: true,
  events: ['timer.stopped'],
  name: 'Test',
  createdBy: 'a1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockDelivery = { id: 'd1', success: true, statusCode: 200 };

describe('WebhooksDispatcher', () => {
  let dispatcher: WebhooksDispatcher;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksDispatcher,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    dispatcher = module.get<WebhooksDispatcher>(WebhooksDispatcher);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('ok'),
    }) as any;

    prisma.webhookDelivery.create.mockResolvedValue(mockDelivery as any);
  });

  describe('dispatch', () => {
    it('envia para todos os destinos ativos inscritos no evento', async () => {
      prisma.webhookDestination.findMany.mockResolvedValue([
        mockDestination({ events: ['timer.stopped'] }),
        mockDestination({ id: 'w2', url: 'https://b.com/hook', events: ['timer.stopped'] }),
      ] as any);
      await dispatcher.dispatch('timer.stopped', { id: 'e1' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('destino inativo não recebe payload', async () => {
      prisma.webhookDestination.findMany.mockResolvedValue([
        mockDestination({ isActive: false }),
      ] as any);
      await dispatcher.dispatch('timer.stopped', { id: 'e1' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('destino inscrito em outro evento não recebe', async () => {
      prisma.webhookDestination.findMany.mockResolvedValue([
        mockDestination({ events: ['time_entry.created'] }),
      ] as any);
      await dispatcher.dispatch('timer.stopped', {});
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendToDestination', () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllTimers();
    });

    it('assinatura HMAC gerada corretamente com secret', async () => {
      const dest = mockDestination({ secret: 'mysecret' });
      await dispatcher.sendToDestination(dest as any, 'timer.stopped', { id: 'e1' });
      const [, callOptions] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = callOptions.body as string;
      const expectedSig = createHmac('sha256', 'mysecret').update(sentBody).digest('hex');
      expect(callOptions.headers['X-TimeTracker-Signature']).toBe(`sha256=${expectedSig}`);
    });

    it('sem secret não envia header de assinatura', async () => {
      await dispatcher.sendToDestination(mockDestination() as any, 'timer.stopped', {});
      const [, callOptions] = (global.fetch as jest.Mock).mock.calls[0];
      expect(callOptions.headers['X-TimeTracker-Signature']).toBeUndefined();
    });

    it('HTTP 500 no destino registra falha e agenda retry', async () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('err') });
      const sendSpy = jest.spyOn(dispatcher, 'sendToDestination');
      await dispatcher.sendToDestination(mockDestination() as any, 'timer.stopped', {}, 1);
      expect(prisma.webhookDelivery.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ success: false }) }),
      );
      jest.advanceTimersByTime(60_001);
      expect(sendSpy).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });

    it('após 3 tentativas não agenda mais retry', async () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('') });
      const sendSpy = jest.spyOn(dispatcher, 'sendToDestination');
      await dispatcher.sendToDestination(mockDestination() as any, 'timer.stopped', {}, 3);
      jest.advanceTimersByTime(1_000_000);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });
});
