# TASK-007 — Auth: Login, JWT Strategy e Rota /me

## Objetivo
Implementar login com JWT, a strategy Passport e a rota de perfil autenticado.

## Escopo

### `src/config/jwt.config.ts`
```typescript
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
}));
```

### `src/auth/strategies/jwt.strategy.ts`
- Estende `PassportStrategy(Strategy, 'jwt')`
- Extrai token do header `Authorization: Bearer <token>`
- Payload do token: `{ sub: string; email: string; role: Role }`
- `validate()` retorna `{ userId: sub, email, role }`

### `src/auth/dto/login.dto.ts`
- `email`: string, isEmail, obrigatório
- `password`: string, obrigatório

### `src/auth/auth.service.ts` — métodos desta task

**`login(dto: LoginDto): Promise<{ accessToken: string }>`**
1. Buscar usuário pelo e-mail
2. Se não encontrado ou senha incorreta: HTTP 401 "Credenciais inválidas" (mensagem genérica)
3. Verificar `emailVerifiedAt`: buscar `SystemSettings` (id=1)
4. Se `requireEmailVerification = true` e `emailVerifiedAt = null`: HTTP 403 "Confirme seu e-mail antes de fazer login"
5. Gerar JWT: `{ sub: user.id, email: user.email, role: user.role }`, validade de `JWT_EXPIRES_IN`
6. Retornar `{ accessToken }`

**`getMe(userId: string): Promise<User>`**
- Buscar usuário pelo id, excluindo `passwordHash`
- Se não encontrado: HTTP 404

### `src/auth/auth.controller.ts` — rotas desta task
```
POST /auth/login   @Public()
GET  /auth/me      (protegido — usa @CurrentUser())
```

### `src/auth/auth.module.ts`
- Importa `PassportModule`, `JwtModule.registerAsync(jwtConfig)`, `MailModule`
- Providers: `AuthService`, `JwtStrategy`

### `src/auth/auth.service.spec.ts` — testes unitários (adicionar a TASK-006)
- `login`: e-mail não encontrado retorna 401 com mensagem genérica
- `login`: senha errada retorna 401 com mesma mensagem genérica
- `login`: e-mail não verificado com `requireEmailVerification=true` retorna 403
- `login`: e-mail não verificado com `requireEmailVerification=false` retorna token
- `login`: credenciais válidas retorna `accessToken` JWT
- `getMe`: usuário não encontrado retorna 404
- `getMe`: retorna usuário sem `passwordHash`

## Critérios de conclusão
- [ ] `POST /auth/login` com credenciais corretas retorna `{ data: { accessToken } }`
- [ ] `GET /auth/me` com token válido retorna perfil sem passwordHash
- [ ] Token expirado em `GET /auth/me` retorna 401
- [ ] Todos os cenários de teste passam
