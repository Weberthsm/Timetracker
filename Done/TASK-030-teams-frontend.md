# TASK-030 — Frontend: Módulo de Equipes

## Objetivo
Criar as telas de listagem, detalhe e gerenciamento de membros de equipes.

## Escopo

### `src/services/teams.service.ts`
```typescript
export const teamsService = {
  list: () => api.get('/teams'),
  get: (id: string) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.patch(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  addMember: (teamId, userId) => api.post(`/teams/${teamId}/members`, { userId }),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};
```

### `src/stores/teams.ts` (Pinia)
- `teams`: lista de equipes
- `currentTeam`: equipe em detalhe com membros
- Actions: `fetchAll`, `fetchOne`, `create`, `update`, `delete`, `addMember`, `removeMember`

### `src/views/teams/TeamsView.vue` (listagem)
- Tabela ou grid de cards
- Cada item: nome da equipe, quantidade de membros
- Botão "Nova Equipe" (admin/manager)
- Estado vazio com CTA

### `src/views/teams/TeamDetailView.vue`
- Nome da equipe + botão editar
- Lista de membros com: avatar, nome, e-mail, role badge
- Botão "Adicionar Membro" → abre modal de seleção
- Botão "Remover" ao lado de cada membro (com ConfirmDialog)
- Botão "Excluir Equipe" (com ConfirmDialog) — aviso de que membros serão desvinculados
- Projetos vinculados à equipe listados como pills/badges

### `src/components/teams/AddMemberModal.vue`
- Input de busca para filtrar usuários disponíveis
- Lista de usuários não pertencentes à equipe
- Seleção e confirmação adicionam o membro via API
- Exibe aviso se usuário já pertence a outra equipe: "Este usuário será movido da equipe X"

### `src/components/teams/TeamFormModal.vue`
- Modal para criar/editar equipe
- Campo: nome (obrigatório, validado)

### Permissões visuais
- Tela de Equipes acessível apenas por admin/manager (guard de rota em TASK-025)
- Member sem acesso é redirecionado para dashboard

## Critérios de conclusão
- [ ] Listagem mostra equipes com contagem de membros
- [ ] Adicionar membro exibe aviso de mudança de equipe
- [ ] Remover membro pede confirmação
- [ ] Excluir equipe desvincula membros (sem excluir usuários)
- [ ] Member redirecionado ao tentar acessar /app/teams
