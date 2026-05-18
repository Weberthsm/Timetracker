import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const admin = { userId: 'a1', email: 'a@t.com', role: 'admin' };
const manager = { userId: 'm1', email: 'm@t.com', role: 'manager' };

const defaultSettings = { id: 1, requireEmailVerification: true, updatedBy: null, updatedAt: new Date() };

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SettingsService>(SettingsService);
  });

  describe('getSettings', () => {
    it('retorna configurações existentes', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue(defaultSettings as any);
      const result = await service.getSettings();
      expect(result.requireEmailVerification).toBe(true);
    });

    it('cria com padrão se não existir', async () => {
      prisma.systemSettings.findUnique.mockResolvedValue(null);
      prisma.systemSettings.create.mockResolvedValue(defaultSettings as any);
      await service.getSettings();
      expect(prisma.systemSettings.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: 1, requireEmailVerification: true }) }),
      );
    });
  });

  describe('updateSettings', () => {
    it('não-admin lança ForbiddenException', async () => {
      await expect(
        service.updateSettings({ requireEmailVerification: false }, manager as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('registra updatedBy com id do admin', async () => {
      prisma.systemSettings.upsert.mockResolvedValue({ ...defaultSettings, updatedBy: 'a1' } as any);
      await service.updateSettings({ requireEmailVerification: false }, admin as any);
      const call = prisma.systemSettings.upsert.mock.calls[0][0];
      expect(call.update).toMatchObject({ updatedBy: 'a1' });
    });

    it('atualiza requireEmailVerification para false', async () => {
      prisma.systemSettings.upsert.mockResolvedValue({ ...defaultSettings, requireEmailVerification: false } as any);
      const result = await service.updateSettings({ requireEmailVerification: false }, admin as any);
      expect(result.requireEmailVerification).toBe(false);
    });
  });
});
