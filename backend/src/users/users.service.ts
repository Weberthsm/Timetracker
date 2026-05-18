import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { paginate } from '../common/utils/paginate';

const userSelect = {
  id: true, name: true, email: true, role: true,
  avatarUrl: true, emailVerifiedAt: true, teamId: true,
  createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { page?: number; limit?: number; search?: string } = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where = filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { email: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUser: JwtPayload) {
    if (currentUser.role !== 'admin' && currentUser.userId !== id) {
      throw new ForbiddenException('Sem permissão para editar este usuário');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.user.update({ where: { id }, data: dto, select: userSelect });
  }

  async remove(id: string, currentUser: JwtPayload) {
    if (currentUser.role !== 'admin') throw new ForbiddenException('Apenas administradores podem excluir usuários');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.user.delete({ where: { id } });
  }

  async updateRole(id: string, dto: UpdateRoleDto, currentUser: JwtPayload) {
    if (currentUser.role !== 'admin') throw new ForbiddenException('Apenas administradores podem alterar roles');
    if (currentUser.userId === id) throw new UnprocessableEntityException('Admin não pode rebaixar a si mesmo');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.user.update({ where: { id }, data: { role: dto.role }, select: userSelect });
  }
}
