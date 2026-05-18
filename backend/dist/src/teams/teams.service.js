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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/utils/paginate");
function checkManagerOrAdmin(user) {
    if (user.role !== 'admin' && user.role !== 'manager') {
        throw new common_1.ForbiddenException('Apenas administradores ou gerentes podem executar esta ação');
    }
}
let TeamsService = class TeamsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, currentUser) {
        checkManagerOrAdmin(currentUser);
        const existing = await this.prisma.team.findUnique({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException('Nome de equipe já existe');
        return this.prisma.team.create({ data: { name: dto.name } });
    }
    async findAll(filters = {}) {
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
        return (0, paginate_1.paginate)(data, total, page, limit);
    }
    async findOne(id) {
        const team = await this.prisma.team.findUnique({
            where: { id },
            include: {
                members: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                },
                teamProjects: { include: { project: { select: { id: true, name: true, color: true } } } },
            },
        });
        if (!team)
            throw new common_1.NotFoundException('Equipe não encontrada');
        return team;
    }
    async update(id, dto, currentUser) {
        checkManagerOrAdmin(currentUser);
        const team = await this.prisma.team.findUnique({ where: { id } });
        if (!team)
            throw new common_1.NotFoundException('Equipe não encontrada');
        if (dto.name && dto.name !== team.name) {
            const dup = await this.prisma.team.findUnique({ where: { name: dto.name } });
            if (dup)
                throw new common_1.ConflictException('Nome de equipe já existe');
        }
        return this.prisma.team.update({ where: { id }, data: dto });
    }
    async remove(id, currentUser) {
        checkManagerOrAdmin(currentUser);
        const team = await this.prisma.team.findUnique({ where: { id } });
        if (!team)
            throw new common_1.NotFoundException('Equipe não encontrada');
        await this.prisma.user.updateMany({ where: { teamId: id }, data: { teamId: null } });
        await this.prisma.team.delete({ where: { id } });
    }
    async addMember(teamId, dto, currentUser) {
        checkManagerOrAdmin(currentUser);
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team)
            throw new common_1.NotFoundException('Equipe não encontrada');
        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        if (user.teamId === teamId)
            throw new common_1.ConflictException('Usuário já pertence a esta equipe');
        await this.prisma.user.update({ where: { id: dto.userId }, data: { teamId } });
        return this.findOne(teamId);
    }
    async removeMember(teamId, userId, currentUser) {
        checkManagerOrAdmin(currentUser);
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team)
            throw new common_1.NotFoundException('Equipe não encontrada');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        await this.prisma.user.update({ where: { id: userId }, data: { teamId: null } });
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map