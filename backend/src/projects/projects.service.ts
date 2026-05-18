import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { paginate } from '../common/utils/paginate';

function checkManagerOrAdmin(user: JwtPayload) {
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new ForbiddenException('Apenas administradores ou gerentes podem executar esta ação');
  }
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    return this.prisma.project.create({ data: { name: dto.name, description: dto.description, color: dto.color } });
  }

  async findAll(
    currentUser: JwtPayload,
    filters: { page?: number; limit?: number; status?: string } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const statusFilter =
      filters.status === 'active' || filters.status === 'archived'
        ? { status: filters.status as 'active' | 'archived' }
        : {};

    const baseWhere: Record<string, unknown> = { ...statusFilter };

    if (currentUser.role === 'member') {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { teamId: true },
      });
      if (!user?.teamId) return paginate([], 0, page, limit);
      baseWhere['teamProjects'] = { some: { teamId: user.teamId } };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: baseWhere,
        include: { _count: { select: { tasks: true, timeEntries: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where: baseWhere }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        teamProjects: { include: { team: { select: { id: true, name: true } } } },
      },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async archive(id: string, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    return this.prisma.project.update({ where: { id }, data: { status: 'archived' } });
  }

  async linkTeam(projectId: string, teamId: string, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    const [project, team] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.team.findUnique({ where: { id: teamId } }),
    ]);
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (!team) throw new NotFoundException('Equipe não encontrada');
    const existing = await this.prisma.teamProject.findUnique({
      where: { teamId_projectId: { teamId, projectId } },
    });
    if (existing) throw new ConflictException('Equipe já vinculada a este projeto');
    await this.prisma.teamProject.create({ data: { teamId, projectId } });
  }

  async unlinkTeam(projectId: string, teamId: string, currentUser: JwtPayload) {
    checkManagerOrAdmin(currentUser);
    await this.prisma.teamProject.deleteMany({ where: { teamId, projectId } });
  }
}
