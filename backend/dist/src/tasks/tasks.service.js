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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/utils/paginate");
let TasksService = class TasksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkProjectAccess(projectId, currentUser) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        if (currentUser.role === 'member') {
            const user = await this.prisma.user.findUnique({ where: { id: currentUser.userId }, select: { teamId: true } });
            if (!user?.teamId)
                throw new common_1.ForbiddenException('Sem acesso a este projeto');
            const link = await this.prisma.teamProject.findFirst({
                where: { projectId, teamId: user.teamId },
            });
            if (!link)
                throw new common_1.ForbiddenException('Sem acesso a este projeto');
        }
        return project;
    }
    async create(projectId, dto, currentUser) {
        await this.checkProjectAccess(projectId, currentUser);
        return this.prisma.task.create({ data: { projectId, title: dto.title, description: dto.description } });
    }
    async findAll(projectId, currentUser, filters = {}) {
        await this.checkProjectAccess(projectId, currentUser);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const where = { projectId };
        if (filters.status)
            where['status'] = filters.status;
        const [data, total] = await this.prisma.$transaction([
            this.prisma.task.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.task.count({ where }),
        ]);
        return (0, paginate_1.paginate)(data, total, page, limit);
    }
    async findOne(projectId, id) {
        const task = await this.prisma.task.findFirst({ where: { id, projectId } });
        if (!task)
            throw new common_1.NotFoundException('Tarefa não encontrada');
        return task;
    }
    async update(projectId, id, dto, currentUser) {
        await this.checkProjectAccess(projectId, currentUser);
        const task = await this.findOne(projectId, id);
        if (dto.status && task.status === 'cancelled' && currentUser.role === 'member') {
            throw new common_1.ForbiddenException('Apenas admin ou gerente podem reativar tarefa cancelada');
        }
        return this.prisma.task.update({ where: { id }, data: dto });
    }
    async remove(projectId, id, currentUser) {
        if (currentUser.role === 'member')
            throw new common_1.ForbiddenException('Apenas admin ou gerente podem excluir tarefas');
        const task = await this.findOne(projectId, id);
        const count = await this.prisma.timeEntry.count({ where: { taskId: id } });
        if (count > 0)
            throw new common_1.UnprocessableEntityException('Tarefa possui lançamentos registrados');
        await this.prisma.task.delete({ where: { id: task.id } });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map