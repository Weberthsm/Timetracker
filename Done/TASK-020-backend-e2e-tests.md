# TASK-020 — Testes E2E de API (Jest + Supertest)

## Objetivo
Implementar testes de integração HTTP que cobrem os fluxos completos ponta a ponta contra o banco de dados real.

## Escopo

### Configuração
**`test/jest-e2e.json`**
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.ts$": "ts-jest" },
  "globalSetup": "./test/setup.ts",
  "globalTeardown": "./test/teardown.ts"
}
```

**`test/setup.ts`** — antes de todos os testes:
- `DATABASE_URL` aponta para banco separado: `timetracker_test`
- `npx prisma migrate deploy` no banco de teste
- Limpar todas as tabelas (order respeitando FK)

**`test/teardown.ts`** — após todos os testes:
- Fechar conexão com o banco

**`test/helpers.ts`**
- `createApp()`: inicializa o app NestJS para testes
- `createAdminToken()`: cria admin e retorna JWT
- `createUserToken(role)`: cria usuário com o role e retorna JWT
- `cleanDb()`: limpa tabelas entre specs (executado em `beforeEach`)

### `test/auth.e2e-spec.ts`
Fluxo completo:
1. `POST /auth/register` → 201
2. `GET /auth/me` sem token → 401
3. `POST /auth/login` sem verificar e-mail (requireEmailVerification=true) → 403
4. `POST /auth/verify-email` com token válido → 200
5. `POST /auth/login` com credenciais corretas → 200 + accessToken
6. `GET /auth/me` com token válido → 200 + perfil
7. `POST /auth/forgot-password` → 200
8. `POST /auth/reset-password` com token válido → 200
9. Login com nova senha → 200

### `test/time-entries.e2e-spec.ts`
Fluxo completo:
1. Admin cria equipe + projeto + vincula equipe ao projeto
2. Cria usuário member e adiciona à equipe
3. Member faz login
4. `POST /time-entries/start` → 201 (timer ativo)
5. `GET /time-entries/active` → retorna timer
6. `POST /time-entries/start` novamente → 422
7. `PATCH /time-entries/:id/stop` → 200 + duration calculada
8. `POST /time-entries` (manual) → 201
9. `GET /reports/daily?date=today&userId=member` → 200 com percentuais
10. Member tenta acessar relatório de outro → 403

### `test/webhooks.e2e-spec.ts`
1. Admin cria destino de webhook (usando ngrok/echo server mock ou interceptando HTTP)
2. `POST /webhooks/:id/test` → 200 + entrega registrada
3. `GET /webhooks/:id/deliveries` → lista a entrega
4. Não-admin tenta criar webhook → 403

## Critérios de conclusão
- [ ] `npm run test:e2e` passa todos os specs
- [ ] Banco de teste é limpo entre cada spec
- [ ] Fluxo completo de auth (register → verify → login → use) passa
- [ ] Fluxo de timer (start → stop → report) passa
- [ ] Permissões verificadas (403 onde esperado) em todos os specs
