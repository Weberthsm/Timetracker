import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { paginate } from '../common/utils/paginate';

@Injectable()
export class TimeEntriesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async checkProjectAccess(projectId: string, currentUser: JwtPayload) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (project.status === 'archived') {
      throw new UnprocessableEntityException('Projeto arquivado não aceita lançamentos');
    }
    if (currentUser.role === 'member') {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.userId }, select: { teamId: true },
      });
      if (!user?.teamId) throw new ForbiddenException('Sem acesso a este projeto');
      const link = await this.prisma.teamProject.findFirst({ where: { projectId, teamId: user.teamId } });
      if (!link) throw new ForbiddenException('Sem acesso a este projeto');
    }
    return project;
  }

  private async checkTaskStatus(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (task.status === 'done' || task.status === 'cancelled') {
      throw new UnprocessableEntityException('Tarefa concluída ou cancelada não aceita novos lançamentos');
    }
    return task;
  }

  async create(dto: CreateTimeEntryDto, currentUser: JwtPayload) {
    await this.checkProjectAccess(dto.projectId, currentUser);
    if (dto.taskId) await this.checkTaskStatus(dto.taskId);

    const dateOnly = new Date(dto.date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (dateOnly > today) throw new UnprocessableEntityException('Não é possível lançar horas em datas futuras');

    // ── Modo só duração ────────────────────────────────────────────────────
    if (dto.durationOnly) {
      if (!dto.durationSeconds || dto.durationSeconds < 60) {
        throw new UnprocessableEntityException('Informe ao menos 1 minuto de duração');
      }
      const entry = await this.prisma.timeEntry.create({
        data: {
          userId: currentUser.userId,
          projectId: dto.projectId,
          taskId: dto.taskId,
          description: dto.description,
          date: dateOnly,
          startedAt: null,
          endedAt: null,
          duration: dto.durationSeconds,
          durationOnly: true,
        },
        include: { project: true, task: true, user: { select: { id: true, name: true, email: true } } },
      });
      this.eventEmitter.emit('time_entry.created', entry);
      return entry;
    }

    // ── Modo com horário (início e fim) ────────────────────────────────────
    if (!dto.startedAt || !dto.endedAt) {
      throw new UnprocessableEntityException('Informe o horário de início e fim');
    }

    const start = new Date(dto.startedAt);
    const end = new Date(dto.endedAt);
    if (end <= start) throw new UnprocessableEntityException('Hora de fim deve ser posterior ao início');

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    const entry = await this.prisma.timeEntry.create({
      data: {
        userId: currentUser.userId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        description: dto.description,
        date: dateOnly,
        startedAt: start,
        endedAt: end,
        duration,
        durationOnly: false,
      },
      include: { project: true, task: true, user: { select: { id: true, name: true, email: true } } },
    });

    this.eventEmitter.emit('time_entry.created', entry);
    return entry;
  }

  async findAll(
    filters: { userId?: string; date?: string; month?: string; projectId?: string; page?: number; limit?: number },
    currentUser: JwtPayload,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const targetUserId = currentUser.role === 'member' ? currentUser.userId : (filters.userId ?? undefined);
    const where: Record<string, unknown> = {};

    if (targetUserId) where['userId'] = targetUserId;
    if (filters.projectId) where['projectId'] = filters.projectId;

    if (filters.date) {
      const d = new Date(filters.date);
      where['date'] = d;
    } else if (filters.month) {
      const [year, month] = filters.month.split('-').map(Number);
      where['date'] = {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0),
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.timeEntry.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, color: true } },
          task: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');
    if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
      throw new ForbiddenException('Sem permissão para acessar este lançamento');
    }
    return entry;
  }

  async update(id: string, dto: UpdateTimeEntryDto, currentUser: JwtPayload) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');
    if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
      throw new ForbiddenException('Sem permissão para editar este lançamento');
    }
    if (!entry.endedAt) throw new UnprocessableEntityException('Pare o timer antes de editar');

    const updateData: Record<string, unknown> = { ...dto };
    delete updateData['createdAt'];

    const startedAt = dto.startedAt ? new Date(dto.startedAt) : entry.startedAt;
    const endedAt = dto.endedAt ? new Date(dto.endedAt) : entry.endedAt;
    if (startedAt && endedAt) {
      updateData['duration'] = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    }

    const updated = await this.prisma.timeEntry.update({ where: { id }, data: updateData as any });
    this.eventEmitter.emit('time_entry.updated', updated);
    return updated;
  }

  async remove(id: string, currentUser: JwtPayload) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');
    if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
      throw new ForbiddenException('Sem permissão para excluir este lançamento');
    }
    if (!entry.endedAt) throw new UnprocessableEntityException('Pare o timer antes de excluir');
    await this.prisma.timeEntry.delete({ where: { id } });
    this.eventEmitter.emit('time_entry.deleted', entry);
  }

  async startTimer(dto: StartTimerDto, currentUser: JwtPayload) {
    const active = await this.prisma.timeEntry.findFirst({
      where: { userId: currentUser.userId, endedAt: null, durationOnly: false },
    });
    if (active) throw new UnprocessableEntityException('Você já tem um timer ativo');

    await this.checkProjectAccess(dto.projectId, currentUser);
    if (dto.taskId) await this.checkTaskStatus(dto.taskId);

    const now = new Date();
    const entry = await this.prisma.timeEntry.create({
      data: {
        userId: currentUser.userId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        description: dto.description,
        startedAt: now,
        endedAt: null,
        duration: null,
        durationOnly: false,
        date: new Date(now.toDateString()),
      },
      include: { project: true, task: true },
    });

    this.eventEmitter.emit('timer.started', entry);
    return entry;
  }

  async stopTimer(id: string, currentUser: JwtPayload) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: { project: true, task: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');
    if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
      throw new ForbiddenException('Sem permissão para parar este timer');
    }
    if (entry.endedAt !== null) {
      throw new UnprocessableEntityException('Este lançamento não é um timer ativo');
    }
    if (!entry.startedAt) {
      throw new UnprocessableEntityException('Lançamento sem horário de início não pode ser parado como timer');
    }

    const now = new Date();
    const duration = Math.floor((now.getTime() - entry.startedAt.getTime()) / 1000);

    const stopped = await this.prisma.timeEntry.update({
      where: { id },
      data: { endedAt: now, duration },
      include: { project: true, task: true, user: { select: { id: true, name: true, email: true } } },
    });

    this.eventEmitter.emit('timer.stopped', stopped);
    return stopped;
  }

  async getActiveTimer(currentUser: JwtPayload) {
    return this.prisma.timeEntry.findFirst({
      where: { userId: currentUser.userId, endedAt: null, durationOnly: false },
      include: { project: true, task: true },
    });
  }
}
