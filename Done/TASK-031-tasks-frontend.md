# TASK-031 — Frontend: Módulo de Tarefas (Lista e Kanban)

## Objetivo
Criar a visualização e gerenciamento de tarefas em formato de lista e kanban, acessíveis via ProjectDetailView.

## Escopo

### `src/services/tasks.service.ts`
```typescript
export const tasksService = {
  list: (projectId: string) => api.get(`/projects/${projectId}/tasks`),
  get: (projectId, id) => api.get(`/projects/${projectId}/tasks/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId, id, data) => api.patch(`/projects/${projectId}/tasks/${id}`, data),
  delete: (projectId, id) => api.delete(`/projects/${projectId}/tasks/${id}`),
};
```

### `src/stores/tasks.ts` (Pinia)
- `tasksByProject`: Record<string, Task[]>
- Actions: `fetchByProject`, `create`, `update`, `remove`

### `src/components/tasks/TaskListView.vue`
Visualização em lista (tabela):
- Colunas: título, status (badge), data de criação, ações
- Filtros: por status (todos / todo / in_progress / done / cancelled)
- Linha clicável → abre `TaskDetailModal`
- Botão "Nova Tarefa" (qualquer usuário com acesso)

### `src/components/tasks/KanbanView.vue`
Visualização em kanban:
- 4 colunas: Todo | Em Progresso | Concluído | Cancelado
- Cards arrastáveis entre colunas via drag-and-drop (`@vueuse/core` ou CSS nativo)
- Ao soltar card: chamar `tasksService.update` com novo status
- Card mostra: título, descrição (truncada), total de lançamentos
- Botão de toggle List/Kanban no topo (persistir preferência no localStorage)

### `src/components/tasks/TaskFormModal.vue`
Modal para criação e edição:
**Campos:** título (obrigatório), descrição (opcional), status (dropdown — ao editar)

**Regras visuais:**
- Dropdown de status ao editar
- Tarefa `cancelled` e role `member`: dropdown mostra todos os status mas a API retornará 403 se tentar reativar

### `src/components/tasks/TaskDetailModal.vue`
- Exibe todos os dados da tarefa
- Histórico de lançamentos vinculados à tarefa
- Botão "Editar" → abre `TaskFormModal`
- Botão "Excluir" (admin/manager apenas, com ConfirmDialog)

### Permissões visuais
- "Nova Tarefa": visível para todos
- "Excluir": visível apenas para admin/manager
- Drag-and-drop disponível para todos, mas reativação de cancelada será rejeitada pela API com toast 403

## Critérios de conclusão
- [ ] Lista e kanban renderizados corretamente
- [ ] Toggle list/kanban persiste preferência
- [ ] Drag-and-drop atualiza status via API
- [ ] Tarefa criada aparece imediatamente na lista/kanban
- [ ] Member não vê botão "Excluir"
