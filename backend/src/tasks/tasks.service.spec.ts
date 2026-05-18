import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const admin = { userId: 'a1', email: 'a@t.com', role: 'admin' };
const member = { userId: 'm1', email: 'm@t.com', role: 'member' };

describe('TasksService', () => {
  let service: TasksService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('projeto não encontrado lança NotFoundException', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.create('p1', { title: 'T' }, admin as any)).rejects.toThrow(NotFoundException);
    });
    it('member sem acesso lança ForbiddenException', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' } as any);
      prisma.user.findUnique.mockResolvedValue({ teamId: null } as any);
      await expect(service.create('p1', { title: 'T' }, member as any)).rejects.toThrow(ForbiddenException);
    });
    it('admin cria tarefa com status todo', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' } as any);
      prisma.task.create.mockResolvedValue({ id: 't1', status: 'todo', title: 'T' } as any);
      const result = await service.create('p1', { title: 'T' }, admin as any);
      expect(result.status).toBe('todo');
    });
  });

  describe('update', () => {
    it('member tenta reativar tarefa cancelled lança ForbiddenException', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' } as any);
      prisma.user.findUnique.mockResolvedValue({ teamId: 't1' } as any);
      prisma.teamProject.findFirst.mockResolvedValue({ teamId: 't1', projectId: 'p1' } as any);
      prisma.task.findFirst.mockResolvedValue({ id: 'task1', status: 'cancelled' } as any);
      await expect(service.update('p1', 'task1', { status: 'todo' }, member as any))
        .rejects.toThrow(ForbiddenException);
    });
    it('member muda status todo→in_progress com sucesso', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' } as any);
      prisma.user.findUnique.mockResolvedValue({ teamId: 't1' } as any);
      prisma.teamProject.findFirst.mockResolvedValue({ teamId: 't1', projectId: 'p1' } as any);
      prisma.task.findFirst.mockResolvedValue({ id: 'task1', status: 'todo' } as any);
      prisma.task.update.mockResolvedValue({ id: 'task1', status: 'in_progress' } as any);
      const result = await service.update('p1', 'task1', { status: 'in_progress' }, member as any);
      expect(result.status).toBe('in_progress');
    });
  });

  describe('remove', () => {
    it('member lança ForbiddenException', async () => {
      await expect(service.remove('p1', 't1', member as any)).rejects.toThrow(ForbiddenException);
    });
    it('tarefa com TimeEntries lança UnprocessableEntityException', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1', status: 'todo' } as any);
      prisma.timeEntry.count.mockResolvedValue(2 as any);
      await expect(service.remove('p1', 't1', admin as any)).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
