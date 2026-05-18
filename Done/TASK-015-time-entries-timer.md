# TASK-015 — TimeEntriesModule: Timer Start/Stop

## Objetivo
Implementar o fluxo de timer (iniciar e parar cronômetro), com testes unitários.

## Escopo

### DTOs
**`start-timer.dto.ts`**
- `projectId`: string, isUUID, obrigatório
- `taskId`: string, isUUID, opcional
- `description`: string, opcional

### `src/time-entries/time-entries.service.ts` — métodos desta task

**`startTimer(dto: StartTimerDto, currentUser): Promise<TimeEntry>`**
1. Verificar se usuário já tem timer ativo: `TimeEntry` com `endedAt = null` e `userId = currentUser.userId` → HTTP 422 "Você já tem um timer ativo"
2. Verificar acesso ao projeto → HTTP 403
3. Projeto arquivado → HTTP 422
4. Se `taskId` informado: status `done`/`cancelled` → HTTP 422
5. Criar `TimeEntry` com:
   - `startedAt = now` (gerado pelo servidor)
   - `endedAt = null`
   - `duration = null`
   - `date = today` (data atual do servidor, formato `Date`)

**`stopTimer(id: string, currentUser): Promise<TimeEntry>`**
1. Buscar TimeEntry pelo id → HTTP 404 se não encontrado
2. Verificar ownership: `member` só para o próprio timer → HTTP 403
3. Verificar que `endedAt = null` (é um timer ativo) → HTTP 422 "Este lançamento não é um timer ativo"
4. Calcular:
   - `endedAt = now`
   - `duration = Math.floor((endedAt - startedAt) / 1000)` em segundos
5. Atualizar e retornar

**`getActiveTimer(currentUser): Promise<TimeEntry | null>`**
- Busca `TimeEntry` com `endedAt = null` do usuário atual
- Retorna `null` se não houver timer ativo
- Incluir relações: project, task

### `src/time-entries/time-entries.controller.ts` — rotas desta task
```
POST  /time-entries/start
PATCH /time-entries/:id/stop
GET   /time-entries/active    (retorna timer ativo ou null)
```

**Atenção:** a rota `/time-entries/active` deve ser registrada **antes** de `/time-entries/:id` para não ser capturada pelo param `id`.

### `src/time-entries/time-entries.service.spec.ts` — adicionar cenários
- `startTimer`: usuário com timer ativo → 422
- `startTimer`: projeto arquivado → 422
- `startTimer`: cria com endedAt=null, date=today
- `stopTimer`: lançamento não é timer (endedAt não é null) → 422
- `stopTimer`: member para timer de outro → 403
- `stopTimer`: duração calculada corretamente (ex: 1h30min = 5400s)

## Critérios de conclusão
- [ ] `POST /time-entries/start` com timer já ativo retorna 422
- [ ] `PATCH /time-entries/:id/stop` calcula duração corretamente
- [ ] `GET /time-entries/active` retorna null quando não há timer
- [ ] Timer criado tem `date` = hoje e `endedAt = null`
- [ ] Todos os cenários de teste passam
