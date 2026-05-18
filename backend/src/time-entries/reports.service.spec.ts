import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const admin = { userId: 'a1', email: 'a@t.com', role: 'admin' };
const manager = { userId: 'm1', email: 'm@t.com', role: 'manager' };
const member = { userId: 'u1', email: 'u@t.com', role: 'member' };

const makeEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 'e1',
  userId: 'u1',
  projectId: 'p1',
  date: new Date('2026-05-14'),
  startedAt: new Date('2026-05-14T09:00:00Z'),
  endedAt: new Date('2026-05-14T10:30:00Z'),
  duration: 5400,
  description: null,
  project: { id: 'p1', name: 'Project A', color: '#f00' },
  task: null,
  ...overrides,
});

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ReportsService>(ReportsService);
  });

  describe('getDailyReport', () => {
    it('membro acessa relatório de outro lança ForbiddenException', async () => {
      await expect(
        service.getDailyReport('2026-05-14', 'other', member as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin acessa relatório de outro usuário sem erro', async () => {
      prisma.timeEntry.findMany.mockResolvedValue([]);
      await expect(
        service.getDailyReport('2026-05-14', 'u1', admin as any),
      ).resolves.toBeDefined();
    });

    it('dia sem lançamentos retorna estrutura vazia com totalSeconds 0', async () => {
      prisma.timeEntry.findMany.mockResolvedValue([]);
      const result = await service.getDailyReport('2026-05-14', 'u1', admin as any);
      expect(result.totalSeconds).toBe(0);
      expect(result.byProject).toHaveLength(0);
      expect(result.entries).toHaveLength(0);
    });

    it('percentual calculado corretamente (1h30min de 5h = 30%)', async () => {
      const entries = [
        makeEntry({ duration: 5400, projectId: 'p1', project: { id: 'p1', name: 'A', color: null } }),
        makeEntry({ id: 'e2', duration: 12600, projectId: 'p2', project: { id: 'p2', name: 'B', color: null } }),
      ];
      prisma.timeEntry.findMany.mockResolvedValue(entries as any);
      const result = await service.getDailyReport('2026-05-14', 'u1', admin as any);
      expect(result.totalSeconds).toBe(18000);
      const p1 = result.byProject.find((p) => p.projectId === 'p1');
      expect(p1?.percentage).toBe(30);
    });
  });

  describe('getMonthlyReport', () => {
    it('membro acessa relatório de outro lança ForbiddenException', async () => {
      await expect(
        service.getMonthlyReport('2026-05', 'other', member as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('totais diários somados corretamente', async () => {
      const entries = [
        makeEntry({ date: new Date('2026-05-01'), duration: 3600 }),
        makeEntry({ id: 'e2', date: new Date('2026-05-01'), duration: 1800 }),
        makeEntry({ id: 'e3', date: new Date('2026-05-02'), duration: 7200 }),
      ];
      prisma.timeEntry.findMany.mockResolvedValue(entries as any);
      const result = await service.getMonthlyReport('2026-05', 'u1', admin as any);
      expect(result.totalSeconds).toBe(12600);
      const day1 = result.byDay.find((d) => d.date === '2026-05-01');
      expect(day1?.totalSeconds).toBe(5400);
    });
  });

  describe('getTeamReport', () => {
    it('member lança ForbiddenException', async () => {
      await expect(
        service.getTeamReport('t1', '2026-05', member as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('manager pode acessar relatório de equipe', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 't1',
        members: [{ id: 'u1', name: 'User 1', email: 'u1@t.com', avatarUrl: null }],
      } as any);
      prisma.timeEntry.findMany.mockResolvedValue([]);
      const result = await service.getTeamReport('t1', '2026-05', manager as any);
      expect(result.members).toHaveLength(1);
    });

    it('membro sem lançamentos aparece com totalSeconds 0', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 't1',
        members: [
          { id: 'u1', name: 'User 1', email: 'u1@t.com', avatarUrl: null },
          { id: 'u2', name: 'User 2', email: 'u2@t.com', avatarUrl: null },
        ],
      } as any);
      prisma.timeEntry.findMany
        .mockResolvedValueOnce([makeEntry({ duration: 3600 })] as any)
        .mockResolvedValueOnce([]);
      const result = await service.getTeamReport('t1', '2026-05', admin as any);
      const u2 = result.members.find((m) => m.member.id === 'u2');
      expect(u2?.totalSeconds).toBe(0);
    });
  });
});
