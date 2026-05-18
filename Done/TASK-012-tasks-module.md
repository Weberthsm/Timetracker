# TASK-012 — TasksModule: CRUD e Atualização de Status

## Objetivo
Implementar criação, listagem, edição, exclusão e atualização de status de tarefas, com testes unitários.

## Escopo

### DTOs (`src/tasks/dto/`)
**`create-task.dto.ts`**
- `title`: string, minLength 1, maxLength 200, obrigatório
- `description`: string, opcional

**`update-task.dto.ts`** (PartialType + `status: TaskStatus` opcional)

### `src/tasks/tasks.service.ts`

**`create(projectId: string, dto: CreateTaskDto, currentUser): Promise<Task>`**
- Qualquer usuário autenticado com acesso ao projeto pode criar
- Verificar acesso: `member` só pode criar em projetos da sua equipe → HTTP 403
- `status` padrão: `todo`
- Projeto não encontrado → HTTP 404

**`findAll(projectId: string, currentUser): Promise<Task[]>`**
- Verificar acesso ao projeto (mesma regra acima)
- Ordenar por `createdAt DESC`

**`findOne(projectId: string, id: string): Promise<Task>`**
- HTTP 404 se não encontrada

**`update(projectId: string, id: string, dto: UpdateTaskDto, currentUser): Promise<Task>`**
- Qualquer usuário com acesso ao projeto pode editar título/descrição
- `status`: qualquer usuário pode alterar, exceto:
  - Tarefa `cancelled` só pode ser reativada por `admin` ou `manager` → HTTP 403 para member
- `updatedAt` registrado automaticamente pelo Prisma

**`remove(projectId: string, id: string, currentUser): Promise<void>`**
- Apenas `admin` ou `manager` → HTTP 403 para member
- Verificar se há TimeEntries vinculadas → HTTP 422 "Tarefa possui lançamentos registrados"

**Validação nos outros módulos (não aqui, mas documentar):**
- Ao criar TimeEntry: tarefa com status `done` ou `cancelled` → HTTP 422

### `src/tasks/tasks.controller.ts`
```
GET    /projects/:projectId/tasks
POST   /projects/:projectId/tasks
GET    /projects/:projectId/tasks/:id
PATCH  /projects/:projectId/tasks/:id
DELETE /projects/:projectId/tasks/:id
```

### `src/tasks/tasks.service.spec.ts`
- `create`: projeto não encontrado → 404
- `create`: member sem acesso ao projeto → 403
- `update`: member tenta reativar tarefa cancelled → 403
- `update`: status `in_progress` → `done` por member → sucesso
- `remove`: member → 403
- `remove`: tarefa com TimeEntries → 422

## Critérios de conclusão
- [ ] Member cria e edita tarefas normalmente
- [ ] Member não pode excluir tarefas (403)
- [ ] Member não pode reativar tarefa cancelada (403)
- [ ] Tarefa com TimeEntries não pode ser excluída (422)
- [ ] Todos os cenários de teste passam
