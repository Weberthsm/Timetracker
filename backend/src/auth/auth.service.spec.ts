import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let mail: DeepMockProxy<MailService>;
  let jwt: DeepMockProxy<JwtService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    mail = mockDeep<MailService>();
    jwt = mockDeep<JwtService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('lança ConflictException se e-mail já cadastrado', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' } as any);
      await expect(service.register({ name: 'A', email: 'test@test.com', password: '12345678' }))
        .rejects.toThrow(ConflictException);
    });

    it('cria usuário com hash bcrypt e não salva senha em texto claro', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: '1', name: 'A', email: 'a@b.com', emailVerifiedAt: null } as any);
      prisma.emailVerificationToken.create.mockResolvedValue({} as any);
      mail.sendEmailVerification.mockResolvedValue();

      await service.register({ name: 'A', email: 'a@b.com', password: '12345678' });

      const createdWith = prisma.user.create.mock.calls[0][0].data;
      expect(createdWith.passwordHash).not.toBe('12345678');
      expect(await bcrypt.compare('12345678', createdWith.passwordHash)).toBe(true);
    });

    it('chama sendEmailVerification', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: '1', name: 'João', email: 'a@b.com' } as any);
      prisma.emailVerificationToken.create.mockResolvedValue({} as any);
      mail.sendEmailVerification.mockResolvedValue();

      await service.register({ name: 'João', email: 'a@b.com', password: '12345678' });
      expect(mail.sendEmailVerification).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('lança UnprocessableEntityException para token inválido', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);
      await expect(service.verifyEmail({ token: 'invalid' })).rejects.toThrow(UnprocessableEntityException);
    });

    it('lança UnprocessableEntityException para token expirado', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: '1', expiresAt: new Date(Date.now() - 1000), user: { emailVerifiedAt: null },
      } as any);
      await expect(service.verifyEmail({ token: 'any' })).rejects.toThrow(UnprocessableEntityException);
    });

    it('sucesso atualiza emailVerifiedAt', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: '1', userId: 'u1', expiresAt: new Date(Date.now() + 10000),
        user: { emailVerifiedAt: null },
      } as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.emailVerificationToken.delete.mockResolvedValue({} as any);

      const result = await service.verifyEmail({ token: 'any' });
      expect(result.message).toContain('confirmado');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { emailVerifiedAt: expect.any(Date) } }),
      );
    });
  });

  describe('login', () => {
    it('lança UnauthorizedException se e-mail não encontrado', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: '12345678' })).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException se senha errada', async () => {
      prisma.user.findUnique.mockResolvedValue({ passwordHash: await bcrypt.hash('other', 10) } as any);
      await expect(service.login({ email: 'x@x.com', password: 'wrongpass' })).rejects.toThrow(UnauthorizedException);
    });

    it('lança ForbiddenException se e-mail não verificado com verificação ativa', async () => {
      const hash = await bcrypt.hash('senha1234', 10);
      prisma.user.findUnique.mockResolvedValue({ id: '1', passwordHash: hash, emailVerifiedAt: null, email: 'a@b.com', role: 'member' } as any);
      prisma.systemSettings.findUnique.mockResolvedValue({ requireEmailVerification: true } as any);
      await expect(service.login({ email: 'a@b.com', password: 'senha1234' })).rejects.toThrow(ForbiddenException);
    });

    it('retorna token se verificação desativada mesmo sem e-mail verificado', async () => {
      const hash = await bcrypt.hash('senha1234', 10);
      prisma.user.findUnique.mockResolvedValue({ id: '1', passwordHash: hash, emailVerifiedAt: null, email: 'a@b.com', role: 'member' } as any);
      prisma.systemSettings.findUnique.mockResolvedValue({ requireEmailVerification: false } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);
      jwt.sign.mockReturnValue('access.token' as any);

      const result = await service.login({ email: 'a@b.com', password: 'senha1234' });
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('forgotPassword', () => {
    it('retorna mensagem genérica para e-mail inexistente', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.forgotPassword({ email: 'nao@existe.com' });
      expect(result.message).toBeTruthy();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('envia e-mail e invalida tokens anteriores', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'A' } as any);
      prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 } as any);
      prisma.passwordResetToken.create.mockResolvedValue({} as any);
      mail.sendPasswordReset.mockResolvedValue();

      await service.forgotPassword({ email: 'a@b.com' });
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalled();
      expect(mail.sendPasswordReset).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('lança UnprocessableEntityException para token inválido', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword({ token: 'bad', password: '12345678' })).rejects.toThrow(UnprocessableEntityException);
    });

    it('lança UnprocessableEntityException para token expirado', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() - 1000), usedAt: null } as any);
      await expect(service.resetPassword({ token: 'x', password: '12345678' })).rejects.toThrow(UnprocessableEntityException);
    });

    it('lança UnprocessableEntityException para token já usado', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() + 10000), usedAt: new Date() } as any);
      await expect(service.resetPassword({ token: 'x', password: '12345678' })).rejects.toThrow(UnprocessableEntityException);
    });

    it('sucesso atualiza senha e marca token como usado', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1', expiresAt: new Date(Date.now() + 10000), usedAt: null } as any);
      prisma.$transaction.mockResolvedValue([{}, {}] as any);

      const result = await service.resetPassword({ token: 'good', password: 'newpass123' });
      expect(result.message).toContain('redefinida');
    });
  });
});
