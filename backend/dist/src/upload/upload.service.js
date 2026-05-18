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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const promises_1 = require("fs/promises");
const path_1 = require("path");
let UploadService = class UploadService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    filePath(relativePath) {
        return (0, path_1.join)(process.cwd(), relativePath);
    }
    extractRelativePath(url) {
        const appUrl = this.config.get('APP_URL') ?? '';
        if (!url.startsWith(appUrl))
            return null;
        return url.replace(appUrl + '/', '');
    }
    async deleteFileIfExists(url) {
        if (!url)
            return;
        const rel = this.extractRelativePath(url);
        if (!rel)
            return;
        try {
            await (0, promises_1.unlink)(this.filePath(rel));
        }
        catch {
        }
    }
    async uploadAvatar(file, targetUserId, currentUser) {
        if (currentUser.role === 'member' && targetUserId !== currentUser.userId) {
            throw new common_1.ForbiddenException('Sem permissão para alterar avatar de outro usuário');
        }
        const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        await this.deleteFileIfExists(user.avatarUrl);
        const appUrl = this.config.get('APP_URL') ?? '';
        const avatarUrl = `${appUrl}/uploads/avatars/${file.filename}`;
        await this.prisma.user.update({ where: { id: targetUserId }, data: { avatarUrl } });
        return { avatarUrl };
    }
    async removeAvatar(targetUserId, currentUser) {
        if (currentUser.role === 'member' && targetUserId !== currentUser.userId) {
            throw new common_1.ForbiddenException('Sem permissão para remover avatar de outro usuário');
        }
        const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        if (!user.avatarUrl)
            return;
        await this.deleteFileIfExists(user.avatarUrl);
        await this.prisma.user.update({ where: { id: targetUserId }, data: { avatarUrl: null } });
    }
    async uploadProjectLogo(file, projectId, currentUser) {
        if (currentUser.role === 'member') {
            throw new common_1.ForbiddenException('Apenas admin ou manager podem alterar logo de projeto');
        }
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        await this.deleteFileIfExists(project.logoUrl);
        const appUrl = this.config.get('APP_URL') ?? '';
        const logoUrl = `${appUrl}/uploads/logos/${file.filename}`;
        await this.prisma.project.update({ where: { id: projectId }, data: { logoUrl } });
        return { logoUrl };
    }
    async removeProjectLogo(projectId, currentUser) {
        if (currentUser.role === 'member') {
            throw new common_1.ForbiddenException('Apenas admin ou manager podem remover logo de projeto');
        }
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.NotFoundException('Projeto não encontrado');
        if (!project.logoUrl)
            return;
        await this.deleteFileIfExists(project.logoUrl);
        await this.prisma.project.update({ where: { id: projectId }, data: { logoUrl: null } });
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map