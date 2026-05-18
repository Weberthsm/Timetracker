# TASK-014 — TimeEntriesModule: CRUD Manual

## Objetivo
Implementar criação manual, listagem, edição e exclusão de lançamentos de horas, com testes unitários.

## Escopo

### DTOs (`src/time-entries/dto/`)
**`create-time-entry.dto.ts`**
- `projectId`: string, isUUID, obrigatório
- `taskId`: string, isUUID, opcional
- `description`: string, opcional
- `date`: string, isDateString (formato YYYY-MM-DD), obrigatório
- `startedAt`: string, isISO8601 (datetime), obrigatório
- `endedAt`: string, isISO8601 (datetime), obrigatório

**`update-time-entry.dto.ts`** (PartialType, todos opcionais exceto validações)

### `src/time-entries/time-entries.service.ts`

**`create(dto: CreateTimeEntryDto, currentUser): Promise<TimeEntry>`**
1. Verificar acesso ao projeto: membro deve pertencer à equipe vinculada → HTTP 403
2. Projeto arquivado → HTTP 422 "Projeto arquivado não aceita lançamentos"
3. Se `taskId` informado: verificar status da tarefa → `done` ou `cancelled` → HTTP 422
4. `endedAt` deve ser posterior a `startedAt` → HTTP 422
5. `date` não pode ser futura (comparar só a data, sem hora) → HTTP 422
6. Calcular `duration = (endedAt - startedAt)` em segundos
7. `createdAt` gerado automaticamente pelo Prisma (não recebe do DTO)

**`findAll(filters: { userId?: string; date?: string; month?: string }, currentUser): Promise<TimeEntry[]>`**
- `member`: só vê os próprios (`userId` ignorado ou deve ser o próprio id)
- `admin`/`manager`: podem filtrar por `userId`
- Filtros opcionais: `date` (dia específico YYYY-MM-DD) ou `month` (YYYY-MM)
- Ordenar por `startedAt DESC`
- Incluir relações: project, task, user (sem passwordHash)

**`findOne(id: string, currentUser): Promise<TimeEntry>`**
- HTTP 404 se não encontrado
- `member` só acessa o próprio → HTTP 403

**`update(id: string, dto: UpdateTimeEntryDto, currentUser): Promise<TimeEntry>`**
- `member` só edita o próprio → HTTP 403
- `admin`/`manager` editam qualquer um
- Timer ativo (`endedAt = null`) não pode ser editado → HTTP 422 "Pare o timer antes de editar"
- `createdAt` nunca pode ser alterado (ignorar se vier no DTO)
- Recalcular `duration` se `startedAt` ou `endedAt` forem alterados

**`remove(id: string, currentUser): Promise<void>`**
- Mesmas regras de propriedade do `update`
- Timer ativo → HTTP 422 "Pare o timer antes de excluir"

### `src/time-entries/time-entries.controller.ts`
```
GET    /time-entries
POST   /time-entries
GET    /time-entries/:id
PATCH  /time-entries/:id
DELETE /time-entries/:id
```

### `src/time-entries/time-entries.service.spec.ts`
- `create`: projeto arquivado → 422
- `create`: tarefa done/cancelled → 422
- `create`: endedAt anterior a startedAt → 422
- `create`: date futura → 422
- `create`: duração calculada corretamente
- `update`: timer ativo → 422
- `update`: member edita lançamento de outro → 403
- `remove`: member remove lançamento de outro → 403

## Critérios de conclusão
- [ ] Lançamento com data futura retorna 422
- [ ] Lançamento em projeto arquivado retorna 422
- [ ] `duration` calculado automaticamente
- [ ] `createdAt` imutável
- [ ] Member só vê e edita os próprios lançamentos
- [ ] Todos os cenários de teste passam
