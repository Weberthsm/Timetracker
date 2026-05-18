import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

const admin = { userId: 'a1', email: 'a@t.com', role: 'admin' };
const member = { userId: 'u1', email: 'u@t.com', role: 'member' };

const mockFile = (filename = 'test.jpg'): Express.Multer.File => ({
  fieldname: 'file',
  originalname: filename,
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1024,
  filename,
  path: `uploads/avatars/${filename}`,
  destination: 'uploads/avatars',
  buffer: Buffer.from(''),
  stream: null as any,
});

describe('UploadService', () => {
  let service: UploadService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => key === 'APP_URL' ? 'http://localhost:3000' : undefined },
        },
      ],
    }).compile();
    service = module.get<UploadService>(UploadService);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  describe('uploadAvatar', () => {
    it('member tenta enviar avatar de outro usuário lança ForbiddenException', async () => {
      await expect(
        service.uploadAvatar(mockFile(), 'other-user', member as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('usuário não encontrado lança NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.uploadAvatar(mockFile(), 'u1', member as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('arquivo anterior é excluído antes de salvar novo', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        avatarUrl: 'http://localhost:3000/uploads/avatars/old.jpg',
      } as any);
      prisma.user.update.mockResolvedValue({ id: 'u1' } as any);
      await service.uploadAvatar(mockFile('new.jpg'), 'u1', member as any);
      expect(fs.unlink).toHaveBeenCalled();
      const updateData = prisma.user.update.mock.calls[0][0].data;
      expect(updateData.avatarUrl).toContain('new.jpg');
    });

    it('admin faz upload de avatar de outro usuário sem erro', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', avatarUrl: null } as any);
      prisma.user.update.mockResolvedValue({ id: 'u2' } as any);
      const result = await service.uploadAvatar(mockFile(), 'u2', admin as any);
      expect(result.avatarUrl).toContain('/uploads/avatars/');
    });
  });

  describe('removeAvatar', () => {
    it('avatarUrl já null retorna sem erro (idempotente)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', avatarUrl: null } as any);
      await expect(service.removeAvatar('u1', member as any)).resolves.toBeUndefined();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('member remove próprio avatar com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        avatarUrl: 'http://localhost:3000/uploads/avatars/old.jpg',
      } as any);
      prisma.user.update.mockResolvedValue({ id: 'u1' } as any);
      await service.removeAvatar('u1', member as any);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { avatarUrl: null } }),
      );
    });
  });

  describe('uploadProjectLogo', () => {
    it('member lança ForbiddenException', async () => {
      await expect(
        service.uploadProjectLogo(mockFile(), 'p1', member as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin faz upload de logo com sucesso', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', logoUrl: null } as any);
      prisma.project.update.mockResolvedValue({ id: 'p1' } as any);
      const result = await service.uploadProjectLogo(mockFile('logo.png'), 'p1', admin as any);
      expect(result.logoUrl).toContain('/uploads/logos/logo.png');
    });
  });
});
