# TASK-033 — Frontend: Telas de Lançamentos (Timer e Manual)

## Objetivo
Criar a tela de histórico de lançamentos com formulário de registro manual e integração com o timer.

## Escopo

### `src/services/timeEntries.service.ts`
```typescript
export const timeEntriesService = {
  list: (params?) => api.get('/time-entries', { params }),
  get: (id) => api.get(`/time-entries/${id}`),
  create: (data) => api.post('/time-entries', data),
  update: (id, data) => api.patch(`/time-entries/${id}`, data),
  delete: (id) => api.delete(`/time-entries/${id}`),
  startTimer: (data) => api.post('/time-entries/start', data),
  stopTimer: (id) => api.patch(`/time-entries/${id}/stop`),
  getActive: () => api.get('/time-entries/active'),
};
```

### `src/views/time-entries/TimeEntriesView.vue`
**Filtros:**
- Seletor de data (padrão: hoje)
- Seletor de projeto (optional)

**Listagem:**
- Agrupada por data
- Cada entrada: horário início–fim, projeto (com cor), tarefa, descrição, duração formatada
- Ações: editar, excluir
- Total de horas do dia no cabeçalho de cada grupo
- Botão "Adicionar lançamento" → abre `TimeEntryFormModal`
- Timer ativo listado no topo com visual diferente (sem duração, cronômetro)

### `src/components/time-entries/TimeEntryFormModal.vue`
Modal para registro manual e edição.

**Campos:**
- Projeto (select, obrigatório)
- Tarefa (select, opcional — filtrado pelo projeto)
- Data (date picker, obrigatório)
  - Datas futuras bloqueadas (`max = today`)
  - Data anterior a hoje: exibir aviso amarelo "Você está registrando horas em uma data anterior a hoje" — não bloqueia
- Hora início (time picker, obrigatório)
- Hora fim (time picker, obrigatório)
  - Validação: fim deve ser após início — mensagem de erro no campo
- Descrição (textarea, opcional)

**Duração calculada automaticamente:**
- Mostrar preview "Duração: 2h 00min" ao preencher início e fim válidos

**Comportamento:**
- Criação: POST `/time-entries`
- Edição: PATCH `/time-entries/:id`
- Sucesso: fecha modal, atualiza lista

### Exclusão com confirmação
- Botão excluir → `ConfirmDialog` "Deseja excluir este lançamento?"
- Após confirmação: DELETE + remove da lista

### Permissões
- Admin/manager veem filtro de usuário (para ver lançamentos de qualquer membro)
- Member só vê os próprios

## Critérios de conclusão
- [ ] Lista agrupa lançamentos por data com total do dia
- [ ] Data futura bloqueada no date picker
- [ ] Aviso visual para data retroativa (sem bloquear)
- [ ] Duração calculada automaticamente ao preencher horários
- [ ] Editar e excluir funcionam corretamente
- [ ] Timer ativo aparece no topo com visual diferente
