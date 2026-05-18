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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/utils/paginate");
const userSelect = {
    id: true, name: true, email: true, role: true,
    avatarUrl: true, emailVerifiedAt: true, teamId: true,
    createdAt: true, updatedAt: true,
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters = {}) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const where = filters.search
            ? {
                OR: [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
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
        return (0, paginate_1.paginate)(data, total, page, limit);
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return user;
    }
    async update(id, dto, currentUser) {
        if (currentUser.role !== 'admin' && currentUser.userId !== id) {
            throw new common_1.ForbiddenException('Sem permissão para editar este usuário');
        }
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return this.prisma.user.update({ where: { id }, data: dto, select: userSelect });
    }
    async remove(id, currentUser) {
        if (currentUser.role !== 'admin')
            throw new common_1.ForbiddenException('Apenas administradores podem excluir usuários');
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        await this.prisma.user.delete({ where: { id } });
    }
    async updateRole(id, dto, currentUser) {
        if (currentUser.role !== 'admin')
            throw new common_1.ForbiddenException('Apenas administradores podem alterar roles');
        if (currentUser.userId === id)
            throw new common_1.UnprocessableEntityException('Admin não pode rebaixar a si mesmo');
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return this.prisma.user.update({ where: { id }, data: { role: dto.role }, select: userSelect });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map