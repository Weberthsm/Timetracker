# TASK-037 — Refresh Token (Backend + Frontend)

## Objetivo
Implementar o fluxo de renovação automática do access token usando refresh token, para evitar deslogar o usuário a cada 15 minutos.

## Escopo

### Backend

**Adicionar campo ao Prisma schema:**
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique  -- hash SHA-256
  expiresAt DateTime           -- válido por 7 dias
  createdAt DateTime @default(now())
}
```
Executar `npx prisma migrate dev --name add-refresh-token`.

**Alterar `auth.service.ts` — `login()`:**
- Além de `accessToken`, gerar e retornar `refreshToken`
- Salvar hash SHA-256 do refresh token em `RefreshToken` com `expiresAt = now + 7d`
- Retornar: `{ accessToken, refreshToken }`

**Novo método `refresh(token: string)`:**
1. Hash SHA-256 do token recebido
2. Buscar `RefreshToken` pelo hash
3. Se não encontrado ou expirado → HTTP 401
4. Gerar novo `accessToken` (15min)
5. Opcionalmente: rotacionar o refresh token (deletar antigo, criar novo)
6. Retornar `{ accessToken }`

**Nova rota:**
```
POST /auth/refresh   @Public()
```
Body: `{ refreshToken: string }`

**Logout:**
- `POST /auth/logout` → deletar o refresh token do usuário atual do banco

### Frontend

**Alterar `authStore`:**
- Persistir `refreshToken` no localStorage
- No logout: limpar ambos os tokens

**Alterar interceptor Axios (`src/services/api.ts`):**
```typescript
// Em responseError interceptor:
if (error.response?.status === 401 && !error.config._retry) {
  error.config._retry = true;
  try {
    const { data } = await axios.post('/auth/refresh', {
      refreshToken: localStorage.getItem('refresh_token'),
    });
    authStore.setToken(data.data.accessToken);
    error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
    return api(error.config); // retry original request
  } catch {
    authStore.logout();
    router.push({ name: 'login' });
  }
}
```

## Critérios de conclusão
- [ ] Login retorna `accessToken` (15min) + `refreshToken` (7 dias)
- [ ] Access token expirado é renovado automaticamente sem interromper o fluxo
- [ ] Refresh token expirado redireciona para login
- [ ] Logout deleta o refresh token do banco
- [ ] `POST /auth/refresh` com token inválido retorna 401
