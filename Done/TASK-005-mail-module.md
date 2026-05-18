# TASK-005 — MailModule (Nodemailer + SMTP)

## Objetivo
Criar o serviço de envio de e-mail usado pelo módulo de autenticação.

## Escopo

### `src/mail/mail.module.ts`
- Módulo global (`@Global()`)
- Exporta `MailService`

### `src/mail/mail.service.ts`
Métodos públicos:

**`sendEmailVerification(to: string, name: string, token: string): Promise<void>`**
- Assunto: "Confirme seu e-mail — TimeTracker"
- Body HTML com link: `${APP_URL}/verify-email?token=${token}`
- Link válido por 24 horas (informar no texto)

**`sendPasswordReset(to: string, name: string, token: string): Promise<void>`**
- Assunto: "Recuperação de senha — TimeTracker"
- Body HTML com link: `${APP_URL}/reset-password?token=${token}`
- Link válido por 1 hora (informar no texto)

### Configuração Nodemailer
- Transporter criado no `OnModuleInit` com variáveis:
  - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- Em `NODE_ENV=test`: usar `nodemailer.createTransport({ jsonTransport: true })` para não enviar e-mails reais

### Templates de e-mail
- HTML simples e responsivo (sem engine de template externa)
- Estilo inline básico: fundo branco, texto escuro, botão de CTA

## Critérios de conclusão
- [ ] `MailService` injetável em outros módulos
- [ ] Em `NODE_ENV=test` não lança erros mesmo sem SMTP configurado
- [ ] Método `sendEmailVerification` não lança erro com configuração válida de SMTP
- [ ] Link no e-mail usa `APP_URL` corretamente
