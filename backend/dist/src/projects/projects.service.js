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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/utils/paginate");
function checkManagerOrAdmin(user) {
    if (user.role !== 'admin' && user.role !== 'manager') {
        throw new common_1.ForbiddenException('Apenas administradores ou gerentes podem executar esta ação');
    }
}
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, currentUser) {
        checkManagerOrAdmin(currentUser);
        return this.prisma.project.create({ data: { name: dto.name, description: dto.description, color: dto.color } });
    }
    async findAll(currentUser, filters = {}) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const statusFilter = filters.status === 'active' || filters.status === 'archived'
            ? { status: filters.status }
            : {};
        const baseWhere = { ...statusFilter };
        if (currentUser.role === 'member') {
            const user = await this.prisma.user.findUnique({
                where: { id: currentUser.userId },
                select: { teamId: true },
            });
            if (!user?.teamId)
                return (0, paginate_1.paginate)([], 0, page, limit);
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
        const mapped = data.map(({ _count, ...p }) => ({ ...p, tasksCount: _count.tasks, timeEntriesCount: _count.timeEntries }));
        return (0, paginate_1.paginate)(mapped, total, page, limit);
    }
    async findOne(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                tasks: { orderBy: { createdAt: 'desc' } },
                teamProjects: { include: { team: { select: { id: true, name: true } } } },
            },
        });
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        return project;
    }
    async update(id, dto, currentUser) {
        checkManagerOrAdmin(currentUser);
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        return this.prisma.project.update({ where: { id }, data: dto });
    }
    async archive(id, currentUser) {
        checkManagerOrAdmin(currentUser);
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        return this.prisma.project.update({ where: { id }, data: { status: 'archived' } });
    }
    async linkTeam(projectId, teamId, currentUser) {
        checkManagerOrAdmin(currentUser);
        const [project, team] = await Promise.all([
            this.prisma.project.findUnique({ where: { id: projectId } }),
            this.prisma.team.findUnique({ where: { id: teamId } }),
        ]);
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        if (!team)
            throw new common_1.NotFoundException('Equipe não encontrada');
        const existing = await this.prisma.teamProject.findUnique({
            where: { teamId_projectId: { teamId, projectId } },
        });
        if (existing)
            throw new common_1.ConflictException('Equipe já vinculada a este projeto');
        await this.prisma.teamProject.create({ data: { teamId, projectId } });
    }
    async unlinkTeam(projectId, teamId, currentUser) {
        checkManagerOrAdmin(currentUser);
        await this.prisma.teamProject.deleteMany({ where: { teamId, projectId } });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map