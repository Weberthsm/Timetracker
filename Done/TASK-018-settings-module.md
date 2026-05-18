# TASK-018 — SettingsModule: Configurações do Sistema

## Objetivo
Implementar a consulta e edição das configurações globais do sistema (singleton), com testes unitários.

## Escopo

### DTO
**`update-settings.dto.ts`**
- `requireEmailVerification`: boolean, isBoolean, opcional

### `src/settings/settings.service.ts`

**`getSettings(): Promise<SystemSettings>`**
- Busca `SystemSettings` com `id = 1`
- Se não existir: criar com valores padrão (`requireEmailVerification: true`) — defesa

**`updateSettings(dto: UpdateSettingsDto, currentUser): Promise<SystemSettings>`**
1. Apenas `admin` → HTTP 403
2. Atualiza apenas os campos presentes no DTO
3. Registra `updatedAt` (automático pelo Prisma) e `updatedBy = currentUser.userId`
4. Retorna configurações atualizadas

### `src/settings/settings.controller.ts`
```
GET   /settings       (apenas admin)
PATCH /settings       (apenas admin)
```

### Integração com AuthService
- O `AuthService.login()` (TASK-007) deve consultar `SystemSettings` via `SettingsService` ou diretamente via Prisma para verificar `requireEmailVerification`
- A mudança de configuração deve ter efeito imediato (sem cache, sem reinicialização)

### `src/settings/settings.service.spec.ts`
- `getSettings`: retorna configurações atuais
- `getSettings`: se não existir, cria com padrão
- `updateSettings`: não-admin → 403
- `updateSettings`: registra `updatedBy` com id do admin
- `updateSettings`: `requireEmailVerification = false` → efeito imediato no próximo login

## Critérios de conclusão
- [ ] `GET /settings` como admin retorna configurações
- [ ] `GET /settings` como manager ou member retorna 403
- [ ] `PATCH /settings` atualiza `requireEmailVerification` imediatamente
- [ ] Após desativar verificação, usuário sem e-mail confirmado consegue fazer login
- [ ] Todos os cenários de teste passam
