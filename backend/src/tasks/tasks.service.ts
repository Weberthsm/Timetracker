import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { paginate } from '../common/utils/paginate';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async checkProjectAccess(projectId: string, currentUser: JwtPayload) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (currentUser.role === 'member') {
      const user = await this.prisma.user.findUnique({ where: { id: currentUser.userId }, select: { teamId: true } });
      if (!user?.teamId) throw new ForbiddenException('Sem acesso a este projeto');
      const link = await this.prisma.teamProject.findFirst({
        where: { projectId, teamId: user.teamId },
      });
      if (!link) throw new ForbiddenException('Sem acesso a este projeto');
    }
    return project;
  }

  async create(projectId: string, dto: CreateTaskDto, currentUser: JwtPayload) {
    await this.checkProjectAccess(projectId, currentUser);
    return this.prisma.task.create({ data: { projectId, title: dto.title, description: dto.description } });
  }

  async findAll(
    projectId: string,
    currentUser: JwtPayload,
    filters: { page?: number; limit?: number; status?: string } = {},
  ) {
    await this.checkProjectAccess(projectId, currentUser);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where: Record<string, unknown> = { projectId };
    if (filters.status) where['status'] = filters.status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(projectId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, projectId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return task;
  }

  async update(projectId: string, id: string, dto: UpdateTaskDto, currentUser: JwtPayload) {
    await this.checkProjectAccess(projectId, currentUser);
    const task = await this.findOne(projectId, id);

    if (dto.status && task.status === 'cancelled' && currentUser.role === 'member') {
      throw new ForbiddenException('Apenas admin ou gerente podem reativar tarefa cancelada');
    }

    return this.prisma.task.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, id: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member') throw new ForbiddenException('Apenas admin ou gerente podem excluir tarefas');
    const task = await this.findOne(projectId, id);
    const count = await this.prisma.timeEntry.count({ where: { taskId: id } });
    if (count > 0) throw new UnprocessableEntityException('Tarefa possui lançamentos registrados');
    await this.prisma.task.delete({ where: { id: task.id } });
  }
}
