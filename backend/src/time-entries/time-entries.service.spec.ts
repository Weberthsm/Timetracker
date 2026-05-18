import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TimeEntriesService } from './time-entries.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const admin = { userId: 'a1', email: 'a@t.com', role: 'admin' };
const member = { userId: 'm1', email: 'm@t.com', role: 'member' };

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;
  let prisma: DeepMockProxy<PrismaService>;
  let emitter: DeepMockProxy<EventEmitter2>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    emitter = mockDeep<EventEmitter2>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeEntriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile();
    service = module.get<TimeEntriesService>(TimeEntriesService);
  });

  describe('create', () => {
    const baseDto = {
      projectId: 'p1',
      date: '2020-01-01',
      startedAt: '2020-01-01T09:00:00Z',
      endedAt: '2020-01-01T11:00:00Z',
    };

    it('projeto arquivado lança UnprocessableEntityException', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', status: 'archived' } as any);
      await expect(service.create(baseDto as any, admin as any)).rejects.toThrow(UnprocessableEntityException);
    });

    it('tarefa done lança UnprocessableEntityException', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', status: 'active' } as any);
      prisma.task.findUnique.mockResolvedValue({ id: 't1', status: 'done' } as any);
      await expect(service.create({ ...baseDto, taskId: 't1' } as any, admin as any)).rejects.toThrow(UnprocessableEntityException);
    });

    it('endedAt anterior a startedAt lança UnprocessableEntityException', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', status: 'active' } as any);
      await expect(service.create({
        ...baseDto,
        startedAt: '2020-01-01T11:00:00Z',
        endedAt: '2020-01-01T09:00:00Z',
      } as any, admin as any)).rejects.toThrow(UnprocessableEntityException);
    });

    it('duração calculada corretamente (2h = 7200s)', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', status: 'active' } as any);
      prisma.timeEntry.create.mockResolvedValue({ id: 'e1', duration: 7200 } as any);
      await service.create(baseDto as any, admin as any);
      const created = prisma.timeEntry.create.mock.calls[0][0].data;
      expect(created.duration).toBe(7200);
    });
  });

  describe('update', () => {
    it('timer ativo lança UnprocessableEntityException', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue({ id: 'e1', userId: 'a1', endedAt: null } as any);
      await expect(service.update('e1', {}, admin as any)).rejects.toThrow(UnprocessableEntityException);
    });

    it('member edita lançamento de outro lança ForbiddenException', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue({ id: 'e1', userId: 'other', endedAt: new Date() } as any);
      await expect(service.update('e1', {}, member as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('startTimer', () => {
    it('segundo timer lança UnprocessableEntityException', async () => {
      prisma.timeEntry.findFirst.mockResolvedValueOnce({ id: 'active' } as any);
      await expect(service.startTimer({ projectId: 'p1' }, member as any)).rejects.toThrow(UnprocessableEntityException);
    });

    it('cria timer com endedAt=null e date=hoje', async () => {
      prisma.timeEntry.findFirst.mockResolvedValueOnce(null);
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', status: 'active' } as any);
      prisma.user.findUnique.mockResolvedValue({ teamId: 't1' } as any);
      prisma.teamProject.findFirst.mockResolvedValue({ projectId: 'p1', teamId: 't1' } as any);
      prisma.timeEntry.create.mockResolvedValue({ id: 'e1', endedAt: null } as any);
      await service.startTimer({ projectId: 'p1' }, member as any);
      const data = prisma.timeEntry.create.mock.calls[0][0].data;
      expect(data.endedAt).toBeNull();
      expect(data.duration).toBeNull();
    });
  });

  describe('stopTimer', () => {
    it('lançamento não é timer lança UnprocessableEntityException', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue({ id: 'e1', userId: 'a1', endedAt: new Date(), startedAt: new Date() } as any);
      await expect(service.stopTimer('e1', admin as any)).rejects.toThrow(UnprocessableEntityException);
    });

    it('member tenta parar timer de outro lança ForbiddenException', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue({ id: 'e1', userId: 'other', endedAt: null, startedAt: new Date() } as any);
      await expect(service.stopTimer('e1', member as any)).rejects.toThrow(ForbiddenException);
    });

    it('duração calculada corretamente ao parar', async () => {
      const start = new Date(Date.now() - 5400000); // 1h30m atrás
      prisma.timeEntry.findUnique.mockResolvedValue({ id: 'e1', userId: 'a1', endedAt: null, startedAt: start } as any);
      prisma.timeEntry.update.mockResolvedValue({ id: 'e1', duration: 5400 } as any);
      const result = await service.stopTimer('e1', admin as any);
      const updateData = prisma.timeEntry.update.mock.calls[0][0].data;
      expect(updateData.duration).toBeGreaterThanOrEqual(5390);
    });
  });
});
