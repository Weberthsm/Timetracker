# TASK-008 — Auth: Recuperação e Redefinição de Senha

## Objetivo
Implementar o fluxo completo de recuperação de senha por e-mail, com testes unitários.

## Escopo

### DTOs (`src/auth/dto/`)
**`forgot-password.dto.ts`**
- `email`: string, isEmail, obrigatório

**`reset-password.dto.ts`**
- `token`: string, obrigatório
- `password`: string, minLength 8, obrigatório

### `src/auth/auth.service.ts` — métodos desta task

**`forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }>`**
1. Resposta sempre genérica (não revelar se e-mail existe)
2. Se usuário existe:
   - Invalidar tokens anteriores pendentes: deletar `PasswordResetToken` onde `userId = user.id` e `usedAt = null`
   - Gerar token aleatório (`crypto.randomBytes(32).toString('hex')`)
   - Hash SHA-256 → salvar em `PasswordResetToken` com `expiresAt = now + 1h`, `usedAt = null`
   - Enviar e-mail via `MailService.sendPasswordReset(email, name, rawToken)`
3. Retornar `{ message: 'Se o e-mail estiver cadastrado, um link foi enviado.' }`

**`resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>`**
1. Hash SHA-256 do token recebido
2. Buscar `PasswordResetToken` pelo hash
3. Se não encontrado: HTTP 422 "Token inválido"
4. Se `expiresAt < now`: HTTP 422 "Token expirado"
5. Se `usedAt` preenchido: HTTP 422 "Token já utilizado"
6. Hash bcrypt da nova senha
7. Atualizar `User.passwordHash` e `PasswordResetToken.usedAt = now` em transação
8. Retornar `{ message: 'Senha redefinida com sucesso.' }`

### `src/auth/auth.controller.ts` — rotas desta task
```
POST /auth/forgot-password  @Public()
POST /auth/reset-password   @Public()
```

### Testes unitários (`auth.service.spec.ts`)
- `forgotPassword`: e-mail inexistente retorna mensagem genérica (não lança erro)
- `forgotPassword`: e-mail existente chama `sendPasswordReset`
- `forgotPassword`: invalida tokens anteriores antes de criar novo
- `resetPassword`: token inválido lança UnprocessableEntityException
- `resetPassword`: token expirado lança UnprocessableEntityException
- `resetPassword`: token já usado lança UnprocessableEntityException
- `resetPassword`: sucesso atualiza passwordHash e marca token como usado

## Critérios de conclusão
- [ ] `POST /auth/forgot-password` com e-mail inexistente retorna 200 com mensagem genérica
- [ ] `POST /auth/forgot-password` com e-mail válido retorna 200 e dispara e-mail
- [ ] `POST /auth/reset-password` com token válido retorna 200 e atualiza senha
- [ ] `POST /auth/reset-password` com token expirado retorna 422
- [ ] Todos os cenários de teste passam
