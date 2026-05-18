"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntriesService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/utils/paginate");
let TimeEntriesService = class TimeEntriesService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async checkProjectAccess(projectId, currentUser) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        if (project.status === 'archived') {
            throw new common_1.UnprocessableEntityException('Projeto arquivado não aceita lançamentos');
        }
        if (currentUser.role === 'member') {
            const user = await this.prisma.user.findUnique({
                where: { id: currentUser.userId }, select: { teamId: true },
            });
            if (!user?.teamId)
                throw new common_1.ForbiddenException('Sem acesso a este projeto');
            const link = await this.prisma.teamProject.findFirst({ where: { projectId, teamId: user.teamId } });
            if (!link)
                throw new common_1.ForbiddenException('Sem acesso a este projeto');
        }
        return project;
    }
    async checkTaskStatus(taskId) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task)
            throw new common_1.NotFoundException('Tarefa não encontrada');
        if (task.status === 'done' || task.status === 'cancelled') {
            throw new common_1.UnprocessableEntityException('Tarefa concluída ou cancelada não aceita novos lançamentos');
        }
        return task;
    }
    async create(dto, currentUser) {
        await this.checkProjectAccess(dto.projectId, currentUser);
        if (dto.taskId)
            await this.checkTaskStatus(dto.taskId);
        const start = new Date(dto.startedAt);
        const end = new Date(dto.endedAt);
        if (end <= start)
            throw new common_1.UnprocessableEntityException('Hora de fim deve ser posterior ao início');
        const dateOnly = new Date(dto.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateOnly > today)
            throw new common_1.UnprocessableEntityException('Não é possível lançar horas em datas futuras');
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
            },
            include: { project: true, task: true, user: { select: { id: true, name: true, email: true } } },
        });
        this.eventEmitter.emit('time_entry.created', entry);
        return entry;
    }
    async findAll(filters, currentUser) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const targetUserId = currentUser.role === 'member' ? currentUser.userId : (filters.userId ?? undefined);
        const where = {};
        if (targetUserId)
            where['userId'] = targetUserId;
        if (filters.projectId)
            where['projectId'] = filters.projectId;
        if (filters.date) {
            const d = new Date(filters.date);
            where['date'] = d;
        }
        else if (filters.month) {
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
        return (0, paginate_1.paginate)(data, total, page, limit);
    }
    async findOne(id, currentUser) {
        const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Lançamento não encontrado');
        if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
            throw new common_1.ForbiddenException('Sem permissão para acessar este lançamento');
        }
        return entry;
    }
    async update(id, dto, currentUser) {
        const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Lançamento não encontrado');
        if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
            throw new common_1.ForbiddenException('Sem permissão para editar este lançamento');
        }
        if (!entry.endedAt)
            throw new common_1.UnprocessableEntityException('Pare o timer antes de editar');
        const updateData = { ...dto };
        delete updateData['createdAt'];
        const startedAt = dto.startedAt ? new Date(dto.startedAt) : entry.startedAt;
        const endedAt = dto.endedAt ? new Date(dto.endedAt) : entry.endedAt;
        if (startedAt && endedAt) {
            updateData['duration'] = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
        }
        const updated = await this.prisma.timeEntry.update({ where: { id }, data: updateData });
        this.eventEmitter.emit('time_entry.updated', updated);
        return updated;
    }
    async remove(id, currentUser) {
        const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Lançamento não encontrado');
        if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
            throw new common_1.ForbiddenException('Sem permissão para excluir este lançamento');
        }
        if (!entry.endedAt)
            throw new common_1.UnprocessableEntityException('Pare o timer antes de excluir');
        await this.prisma.timeEntry.delete({ where: { id } });
        this.eventEmitter.emit('time_entry.deleted', entry);
    }
    async startTimer(dto, currentUser) {
        const active = await this.prisma.timeEntry.findFirst({
            where: { userId: currentUser.userId, endedAt: null },
        });
        if (active)
            throw new common_1.UnprocessableEntityException('Você já tem um timer ativo');
        await this.checkProjectAccess(dto.projectId, currentUser);
        if (dto.taskId)
            await this.checkTaskStatus(dto.taskId);
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
                date: new Date(now.toDateString()),
            },
            include: { project: true, task: true },
        });
        this.eventEmitter.emit('timer.started', entry);
        return entry;
    }
    async stopTimer(id, currentUser) {
        const entry = await this.prisma.timeEntry.findUnique({
            where: { id },
            include: { project: true, task: true, user: { select: { id: true, name: true, email: true } } },
        });
        if (!entry)
            throw new common_1.NotFoundException('Lançamento não encontrado');
        if (currentUser.role === 'member' && entry.userId !== currentUser.userId) {
            throw new common_1.ForbiddenException('Sem permissão para parar este timer');
        }
        if (entry.endedAt !== null) {
            throw new common_1.UnprocessableEntityException('Este lançamento não é um timer ativo');
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
    async getActiveTimer(currentUser) {
        return this.prisma.timeEntry.findFirst({
            where: { userId: currentUser.userId, endedAt: null },
            include: { project: true, task: true },
        });
    }
};
exports.TimeEntriesService = TimeEntriesService;
exports.TimeEntriesService = TimeEntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], TimeEntriesService);
//# sourceMappingURL=time-entries.service.js.map