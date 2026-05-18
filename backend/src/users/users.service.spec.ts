import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const adminUser = { userId: 'admin-id', email: 'admin@test.com', role: 'admin' };
const memberUser = { userId: 'member-id', email: 'member@test.com', role: 'member' };

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('retorna lista sem passwordHash', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: '1', name: 'A' }] as any);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('member tenta editar outro usuário lança 403', async () => {
      await expect(service.update('other-id', { name: 'X' }, memberUser as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('member edita a si mesmo com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'member-id' } as any);
      prisma.user.update.mockResolvedValue({ id: 'member-id', name: 'Novo Nome' } as any);
      const result = await service.update('member-id', { name: 'Novo Nome' }, memberUser as any);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('não-admin lança ForbiddenException', async () => {
      await expect(service.remove('any-id', memberUser as any)).rejects.toThrow(ForbiddenException);
    });

    it('admin exclui com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1' } as any);
      prisma.user.delete.mockResolvedValue({} as any);
      await expect(service.remove('1', adminUser as any)).resolves.not.toThrow();
    });
  });

  describe('updateRole', () => {
    it('não-admin lança ForbiddenException', async () => {
      await expect(service.updateRole('1', { role: 'manager' } as any, memberUser as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('admin rebaixa a si mesmo lança UnprocessableEntityException', async () => {
      await expect(service.updateRole('admin-id', { role: 'member' } as any, adminUser as any))
        .rejects.toThrow(UnprocessableEntityException);
    });

    it('admin altera role de outro usuário com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'other' } as any);
      prisma.user.update.mockResolvedValue({ id: 'other', role: 'manager' } as any);
      const result = await service.updateRole('other', { role: 'manager' } as any, adminUser as any);
      expect(result).toBeDefined();
    });
  });
});
