# TASK-006 — Auth: Cadastro e Verificação de E-mail

## Objetivo
Implementar o fluxo de cadastro de usuário e confirmação de e-mail, com testes unitários.

## Escopo

### DTOs (`src/auth/dto/`)
**`register.dto.ts`**
- `name`: string, minLength 2, maxLength 150, obrigatório
- `email`: string, isEmail, obrigatório
- `password`: string, minLength 8, obrigatório

**`verify-email.dto.ts`**
- `token`: string, obrigatório

**`resend-verification.dto.ts`**
- `email`: string, isEmail, obrigatório

### `src/auth/auth.service.ts` — métodos desta task

**`register(dto: RegisterDto): Promise<{ message: string }>`**
1. Verificar e-mail duplicado → HTTP 409 "E-mail já cadastrado"
2. Hash bcrypt da senha (rounds: 10)
3. Criar `User` com `role: member`, `emailVerifiedAt: null`
4. Gerar token aleatório (`crypto.randomBytes(32).toString('hex')`)
5. Hash SHA-256 do token → armazenar em `EmailVerificationToken` com `expiresAt = now + 24h`
6. Chamar `MailService.sendEmailVerification(email, name, rawToken)`
7. Retornar `{ message: 'Cadastro realizado. Verifique seu e-mail.' }`

**`verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }>`**
1. Hash SHA-256 do token recebido
2. Buscar `EmailVerificationToken` pelo hash
3. Se não encontrado: HTTP 422 "Token inválido"
4. Se expirado: HTTP 422 "Token expirado"
5. Se já usado (emailVerifiedAt já preenchido): HTTP 422 "Token já utilizado"
6. Atualizar `User.emailVerifiedAt = now`
7. Deletar token usado
8. Retornar `{ message: 'E-mail confirmado com sucesso.' }`

**`resendVerification(dto: ResendVerificationDto): Promise<{ message: string }>`**
1. Resposta sempre genérica (não revelar se e-mail existe)
2. Se usuário existe e `emailVerifiedAt` é null:
   - Rate limit: verificar se há token criado há menos de 1 minuto → HTTP 429
   - Deletar tokens anteriores do usuário
   - Gerar e salvar novo token
   - Enviar e-mail
3. Retornar `{ message: 'Se o e-mail estiver cadastrado, um novo link foi enviado.' }`

### `src/auth/auth.controller.ts` — rotas desta task
```
POST /auth/register          @Public()
POST /auth/verify-email      @Public()
POST /auth/resend-verification  @Public()
```

### `src/auth/auth.service.spec.ts` — testes unitários
Usar `jest-mock-extended` para mockar `PrismaService` e `MailService`.

Cenários obrigatórios:
- `register`: e-mail duplicado lança ConflictException
- `register`: cria usuário com hash bcrypt, não salva senha em texto claro
- `register`: chama `sendEmailVerification` com token correto
- `verifyEmail`: token inválido lança UnprocessableEntityException
- `verifyEmail`: token expirado lança UnprocessableEntityException
- `verifyEmail`: sucesso atualiza `emailVerifiedAt`
- `resendVerification`: rate limit lança TooManyRequestsException
- `resendVerification`: resposta genérica independente de e-mail existir

## Critérios de conclusão
- [ ] `POST /auth/register` retorna 201 com mensagem genérica
- [ ] `POST /auth/verify-email` com token válido retorna 200
- [ ] `POST /auth/verify-email` com token expirado retorna 422
- [ ] `POST /auth/resend-verification` dentro de 1 min retorna 429
- [ ] Testes unitários passam com 100% dos cenários listados
