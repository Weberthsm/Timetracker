"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}
function randomToken() {
    return crypto.randomBytes(32).toString('hex');
}
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailService;
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('E-mail já cadastrado');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: { name: dto.name, email: dto.email, passwordHash, role: 'member' },
        });
        const raw = randomToken();
        await this.prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token: sha256(raw),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        await this.mailService.sendEmailVerification(user.email, user.name, raw);
        return { message: 'Cadastro realizado. Verifique seu e-mail.' };
    }
    async verifyEmail(dto) {
        const hashed = sha256(dto.token);
        const record = await this.prisma.emailVerificationToken.findUnique({
            where: { token: hashed },
            include: { user: true },
        });
        if (!record)
            throw new common_1.UnprocessableEntityException('Token inválido');
        if (record.expiresAt < new Date())
            throw new common_1.UnprocessableEntityException('Token expirado');
        if (record.user.emailVerifiedAt)
            throw new common_1.UnprocessableEntityException('Token já utilizado');
        await this.prisma.user.update({
            where: { id: record.userId },
            data: { emailVerifiedAt: new Date() },
        });
        await this.prisma.emailVerificationToken.delete({ where: { id: record.id } });
        return { message: 'E-mail confirmado com sucesso.' };
    }
    async resendVerification(dto) {
        const generic = { message: 'Se o e-mail estiver cadastrado, um novo link foi enviado.' };
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || user.emailVerifiedAt)
            return generic;
        const latest = await this.prisma.emailVerificationToken.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        if (latest && latest.createdAt.getTime() > Date.now() - 60 * 1000) {
            throw new common_1.HttpException('Aguarde 1 minuto antes de solicitar novo envio.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        await this.prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
        const raw = randomToken();
        await this.prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token: sha256(raw),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        await this.mailService.sendEmailVerification(user.email, user.name, raw);
        return generic;
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 1 } });
        if (settings?.requireEmailVerification && !user.emailVerifiedAt) {
            throw new common_1.ForbiddenException('Confirme seu e-mail antes de fazer login');
        }
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        const rawRefresh = randomToken();
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: sha256(rawRefresh),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return { accessToken, refreshToken: rawRefresh };
    }
    async refresh(dto) {
        const hashed = sha256(dto.refreshToken);
        const record = await this.prisma.refreshToken.findUnique({
            where: { token: hashed },
            include: { user: true },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token inválido ou expirado');
        }
        await this.prisma.refreshToken.delete({ where: { id: record.id } });
        const newRaw = randomToken();
        await this.prisma.refreshToken.create({
            data: {
                userId: record.userId,
                token: sha256(newRaw),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        const payload = { sub: record.user.id, email: record.user.email, role: record.user.role };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken, refreshToken: newRaw };
    }
    async logout(userId) {
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
        return { message: 'Sessão encerrada.' };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, email: true, role: true,
                avatarUrl: true, emailVerifiedAt: true, teamId: true,
                createdAt: true, updatedAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return user;
    }
    async forgotPassword(dto) {
        const generic = { message: 'Se o e-mail estiver cadastrado, um link foi enviado.' };
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            return generic;
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id, usedAt: null },
        });
        const raw = randomToken();
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: sha256(raw),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        await this.mailService.sendPasswordReset(user.email, user.name, raw);
        return generic;
    }
    async resetPassword(dto) {
        const hashed = sha256(dto.token);
        const record = await this.prisma.passwordResetToken.findUnique({ where: { token: hashed } });
        if (!record)
            throw new common_1.UnprocessableEntityException('Token inválido');
        if (record.expiresAt < new Date())
            throw new common_1.UnprocessableEntityException('Token expirado');
        if (record.usedAt)
            throw new common_1.UnprocessableEntityException('Token já utilizado');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
            this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        ]);
        return { message: 'Senha redefinida com sucesso.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map