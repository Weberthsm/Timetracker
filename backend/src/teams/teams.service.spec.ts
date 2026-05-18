import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const admin = { userId: 'a1', email: 'a@test.com', role: 'admin' };
const member = { userId: 'm1', email: 'm@test.com', role: 'member' };

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<TeamsService>(TeamsService);
  });

  describe('create', () => {
    it('member lança ForbiddenException', async () => {
      await expect(service.create({ name: 'X' }, member as any)).rejects.toThrow(ForbiddenException);
    });
    it('nome duplicado lança ConflictException', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: '1', name: 'Dup' } as any);
      await expect(service.create({ name: 'Dup' }, admin as any)).rejects.toThrow(ConflictException);
    });
    it('cria equipe com sucesso', async () => {
      prisma.team.findUnique.mockResolvedValue(null);
      prisma.team.create.mockResolvedValue({ id: '1', name: 'Nova' } as any);
      const result = await service.create({ name: 'Nova' }, admin as any);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('desvincula membros sem excluí-los', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: 't1' } as any);
      prisma.user.updateMany.mockResolvedValue({ count: 3 } as any);
      prisma.team.delete.mockResolvedValue({} as any);
      await service.remove('t1', admin as any);
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { teamId: null } }),
      );
    });
  });

  describe('addMember', () => {
    it('usuário já na equipe lança ConflictException', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: 't1' } as any);
      prisma.user.findUnique.mockResolvedValue({ id: 'm1', teamId: 't1' } as any);
      await expect(service.addMember('t1', { userId: 'm1' }, admin as any)).rejects.toThrow(ConflictException);
    });
    it('usuário em outra equipe é movido', async () => {
      prisma.team.findUnique.mockResolvedValueOnce({ id: 't1' } as any);
      prisma.user.findUnique.mockResolvedValue({ id: 'm1', teamId: 'other' } as any);
      prisma.user.update.mockResolvedValue({ id: 'm1', teamId: 't1' } as any);
      prisma.team.findUnique.mockResolvedValueOnce({ id: 't1', members: [], teamProjects: [] } as any);
      await service.addMember('t1', { userId: 'm1' }, admin as any);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { teamId: 't1' } }),
      );
    });
  });

  describe('removeMember', () => {
    it('member lança ForbiddenException', async () => {
      await expect(service.removeMember('t1', 'u1', member as any)).rejects.toThrow(ForbiddenException);
    });
  });
});
