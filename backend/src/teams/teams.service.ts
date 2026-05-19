import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { paginate } from '../common/utils/paginate';

function checkManagerOrAdmin(user: JwtPayload) {
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new ForbiddenException('Apenas administradores ou gerentes podem executar esta ação');
  }
}

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const existing = await this.prisma.team.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Nome de equipe já existe');
    return this.prisma.team.create({ data: { name: dto.name } });
  }

  async findAll(filters: { page?: number; limit?: number } = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.team.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { members: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.team.count(),
    ]);

    const mapped = data.map(({ _count, ...t }) => ({ ...t, membersCount: _count.members }));
    return paginate(mapped, total, page, limit);
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        teamProjects: { include: { project: { select: { id: true, name: true, color: true } } } },
      },
    });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    return team;
  }

  async update(id: string, dto: UpdateTeamDto, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    if (dto.name && dto.name !== team.name) {
      const dup = await this.prisma.team.findUnique({ where: { name: dto.name } });
      if (dup) throw new ConflictException('Nome de equipe já existe');
    }
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  async remove(id: string, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    await this.prisma.user.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await this.prisma.team.delete({ where: { id } });
  }

  async addMember(teamId: string, dto: AddMemberDto, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.teamId === teamId) throw new ConflictException('Usuário já pertence a esta equipe');
    await this.prisma.user.update({ where: { id: dto.userId }, data: { teamId } });
    return this.findOne(teamId);
  }

  async removeMember(teamId: string, userId: string, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.user.update({ where: { id: userId }, data: { teamId: null } });
  }
}
