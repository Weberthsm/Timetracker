import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      this.transporter = nodemailer.createTransport({ jsonTransport: true } as any);
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('MAIL_HOST'),
        port: this.config.get<number>('MAIL_PORT'),
        auth: {
          user: this.config.get<string>('MAIL_USER'),
          pass: this.config.get<string>('MAIL_PASS'),
        },
      });
    }
  }

  async sendEmailVerification(to: string, name: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL');
    const link = `${appUrl}/verify-email?token=${token}`;
    const from = this.config.get<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Confirme seu e-mail — TimeTracker',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2>Olá, ${name}!</h2>
          <p>Obrigado por se cadastrar no TimeTracker. Clique no botão abaixo para confirmar seu e-mail.</p>
          <p>O link é válido por <strong>24 horas</strong>.</p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
            Confirmar e-mail
          </a>
          <p style="color:#6B7280;font-size:12px;">Se você não criou uma conta, ignore este e-mail.</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL');
    const link = `${appUrl}/reset-password?token=${token}`;
    const from = this.config.get<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Recuperação de senha — TimeTracker',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2>Olá, ${name}!</h2>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p>O link é válido por <strong>1 hora</strong>.</p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#EF4444;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
            Redefinir senha
          </a>
          <p style="color:#6B7280;font-size:12px;">Se você não solicitou a redefinição, ignore este e-mail.</p>
        </div>
      `,
    });
  }
}
