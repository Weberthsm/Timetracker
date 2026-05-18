import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const admin = { userId: 'a1', email: 'a@t.com', role: 'admin' };
const member = { userId: 'm1', email: 'm@t.com', role: 'member' };

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('member lança ForbiddenException', async () => {
      await expect(service.create({ name: 'P' }, member as any)).rejects.toThrow(ForbiddenException);
    });
    it('admin cria projeto', async () => {
      prisma.project.create.mockResolvedValue({ id: '1', name: 'P' } as any);
      const result = await service.create({ name: 'P' }, admin as any);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('member vê apenas projetos da sua equipe', async () => {
      prisma.user.findUnique.mockResolvedValue({ teamId: 'team1' } as any);
      prisma.project.findMany.mockResolvedValue([{ id: '1' }] as any);
      const result = await service.findAll(member as any);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { teamProjects: { some: { teamId: 'team1' } } } }),
      );
      expect(result).toHaveLength(1);
    });
    it('member sem equipe retorna array vazio', async () => {
      prisma.user.findUnique.mockResolvedValue({ teamId: null } as any);
      const result = await service.findAll(member as any);
      expect(result).toEqual([]);
    });
  });

  describe('archive', () => {
    it('seta status=archived sem deletar', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: '1', status: 'active' } as any);
      prisma.project.update.mockResolvedValue({ id: '1', status: 'archived' } as any);
      const result = await service.archive('1', admin as any);
      expect(result.status).toBe('archived');
      expect(prisma.project.delete).not.toHaveBeenCalled();
    });
  });

  describe('linkTeam', () => {
    it('vínculo duplicado lança ConflictException', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' } as any);
      prisma.team.findUnique.mockResolvedValue({ id: 't1' } as any);
      prisma.teamProject.findUnique.mockResolvedValue({ teamId: 't1', projectId: 'p1' } as any);
      await expect(service.linkTeam('p1', 't1', admin as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('unlinkTeam', () => {
    it('não apaga TimeEntries', async () => {
      prisma.teamProject.deleteMany.mockResolvedValue({ count: 1 } as any);
      await service.unlinkTeam('p1', 't1', admin as any);
      expect(prisma.timeEntry.deleteMany).not.toHaveBeenCalled();
    });
  });
});
