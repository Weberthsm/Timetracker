# TASK-002 — Prisma Schema e Migrations

## Objetivo
Criar o schema Prisma completo com todos os modelos, enums e relações. Executar a migration inicial.

## Escopo

### Inicializar Prisma
```bash
npx prisma init --datasource-provider postgresql
```

### Arquivo `prisma/schema.prisma`
Implementar todos os modelos exatamente conforme a seção 3 do plano:

**Enums:**
- `Role` → `admin | manager | member`
- `ProjectStatus` → `active | archived`
- `TaskStatus` → `todo | in_progress | done | cancelled`

**Modelos:**
- `User` — id, name, email (unique), passwordHash, role, avatarUrl?, emailVerifiedAt?, teamId?, relações, timestamps
- `Team` — id, name, relações (members, teamProjects), timestamps
- `Project` — id, name, description?, color?, logoUrl?, status, relações (teamProjects, tasks, timeEntries), timestamps
- `TeamProject` — chave composta (teamId, projectId), relações com Team e Project
- `Task` — id, projectId, title, description?, status, relações (timeEntries), timestamps
- `TimeEntry` — id, userId, projectId, taskId?, description?, startedAt, endedAt?, duration?, date (@db.Date), timestamps
- `EmailVerificationToken` — id, userId, token (unique), expiresAt, createdAt
- `PasswordResetToken` — id, userId, token (unique), expiresAt, usedAt?, createdAt
- `SystemSettings` — id (default 1), requireEmailVerification (default true), updatedAt, updatedBy?
- `WebhookDestination` — id, name, url, secret?, events (String[]), isActive (default true), createdBy, timestamps, relação com deliveries
- `WebhookDelivery` — id, webhookDestinationId, event, payload (Json), statusCode?, responseBody?, attempt (default 1), success, deliveredAt

### Executar migration
```bash
npx prisma migrate dev --name init
```

### Gerar tipos TypeScript
```bash
npx prisma generate
```

## Critérios de conclusão
- [ ] `npx prisma migrate dev` executa sem erros
- [ ] `npx prisma generate` gera tipos em `node_modules/.prisma/client`
- [ ] Banco tem todas as 11 tabelas criadas
- [ ] `npx prisma studio` mostra todos os modelos corretamente
