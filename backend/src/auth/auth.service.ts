import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

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

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const hashed = sha256(dto.token);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token: hashed },
      include: { user: true },
    });

    if (!record) throw new UnprocessableEntityException('Token inválido');
    if (record.expiresAt < new Date()) throw new UnprocessableEntityException('Token expirado');
    if (record.user.emailVerifiedAt) throw new UnprocessableEntityException('Token já utilizado');

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await this.prisma.emailVerificationToken.delete({ where: { id: record.id } });

    return { message: 'E-mail confirmado com sucesso.' };
  }

  async resendVerification(dto: ResendVerificationDto): Promise<{ message: string }> {
    const generic = { message: 'Se o e-mail estiver cadastrado, um novo link foi enviado.' };
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || user.emailVerifiedAt) return generic;

    const latest = await this.prisma.emailVerificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latest && latest.createdAt.getTime() > Date.now() - 60 * 1000) {
      throw new HttpException('Aguarde 1 minuto antes de solicitar novo envio.', HttpStatus.TOO_MANY_REQUESTS);
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

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings?.requireEmailVerification && !user.emailVerifiedAt) {
      throw new ForbiddenException('Confirme seu e-mail antes de fazer login');
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

  async refresh(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    const hashed = sha256(dto.refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const newRaw = randomToken();

    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({ where: { id: record.id } }),
      this.prisma.refreshToken.create({
        data: {
          userId: record.userId,
          token: sha256(newRaw),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const payload = { sub: record.user.id, email: record.user.email, role: record.user.role };
    const accessToken = this.jwtService.sign(payload);

    // Return both tokens so the client can keep the rotation chain alive
    return { accessToken, refreshToken: newRaw };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Sessão encerrada.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        avatarUrl: true, emailVerifiedAt: true, teamId: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const generic = { message: 'Se o e-mail estiver cadastrado, um link foi enviado.' };
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return generic;

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

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hashed = sha256(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token: hashed } });

    if (!record) throw new UnprocessableEntityException('Token inválido');
    if (record.expiresAt < new Date()) throw new UnprocessableEntityException('Token expirado');
    if (record.usedAt) throw new UnprocessableEntityException('Token já utilizado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { message: 'Senha redefinida com sucesso.' };
  }
}
