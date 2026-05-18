import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private filePath(relativePath: string): string {
    return join(process.cwd(), relativePath);
  }

  private extractRelativePath(url: string): string | null {
    const appUrl = this.config.get<string>('APP_URL') ?? '';
    if (!url.startsWith(appUrl)) return null;
    return url.replace(appUrl + '/', '');
  }

  private async deleteFileIfExists(url: string | null): Promise<void> {
    if (!url) return;
    const rel = this.extractRelativePath(url);
    if (!rel) return;
    try {
      await unlink(this.filePath(rel));
    } catch {
      // ignore if file already gone
    }
  }

  async uploadAvatar(file: Express.Multer.File, targetUserId: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member' && targetUserId !== currentUser.userId) {
      throw new ForbiddenException('Sem permissão para alterar avatar de outro usuário');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.deleteFileIfExists(user.avatarUrl);

    const appUrl = this.config.get<string>('APP_URL') ?? '';
    const avatarUrl = `${appUrl}/uploads/avatars/${file.filename}`;
    await this.prisma.user.update({ where: { id: targetUserId }, data: { avatarUrl } });
    return { avatarUrl };
  }

  async removeAvatar(targetUserId: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member' && targetUserId !== currentUser.userId) {
      throw new ForbiddenException('Sem permissão para remover avatar de outro usuário');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (!user.avatarUrl) return;

    await this.deleteFileIfExists(user.avatarUrl);
    await this.prisma.user.update({ where: { id: targetUserId }, data: { avatarUrl: null } });
  }

  async uploadProjectLogo(file: Express.Multer.File, projectId: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member') {
      throw new ForbiddenException('Apenas admin ou manager podem alterar logo de projeto');
    }
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');

    await this.deleteFileIfExists(project.logoUrl);

    const appUrl = this.config.get<string>('APP_URL') ?? '';
    const logoUrl = `${appUrl}/uploads/logos/${file.filename}`;
    await this.prisma.project.update({ where: { id: projectId }, data: { logoUrl } });
    return { logoUrl };
  }

  async removeProjectLogo(projectId: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member') {
      throw new ForbiddenException('Apenas admin ou manager podem remover logo de projeto');
    }
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (!project.logoUrl) return;

    await this.deleteFileIfExists(project.logoUrl);
    await this.prisma.project.update({ where: { id: projectId }, data: { logoUrl: null } });
  }
}
