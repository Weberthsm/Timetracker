import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings) return settings;
    return this.prisma.systemSettings.create({
      data: { id: 1, requireEmailVerification: true },
    });
  }

  async updateSettings(dto: UpdateSettingsDto, currentUser: JwtPayload) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem alterar as configurações');
    }
    return this.prisma.systemSettings.upsert({
      where: { id: 1 },
      create: { id: 1, requireEmailVerification: true, ...dto, updatedBy: currentUser.userId },
      update: { ...dto, updatedBy: currentUser.userId },
    });
  }
}
