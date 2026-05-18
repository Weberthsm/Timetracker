# TASK-029 — Frontend: Módulo de Projetos

## Objetivo
Criar as telas de listagem, detalhe, criação/edição de projetos e upload de logo.

## Escopo

### `src/services/projects.service.ts`
```typescript
export const projectsService = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  archive: (id) => api.delete(`/projects/${id}`),
  uploadLogo: (id, file) => api.post(`/upload/projects/${id}/logo`, formData(file), { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeLogo: (id) => api.delete(`/upload/projects/${id}/logo`),
};
```

### `src/stores/projects.ts` (Pinia)
- `projects`: lista de projetos
- `currentProject`: projeto em detalhe
- Actions: `fetchAll`, `fetchOne`, `create`, `update`, `archive`

### `src/views/projects/ProjectsView.vue` (listagem)
- Grid de cards de projetos
- Cada card: logo (ou cor como fallback), nome, status badge, quantidade de tarefas
- Projetos arquivados: visual atenuado com badge "Arquivado"
- Botão "Novo Projeto" (visível para admin/manager)
- Filtro: todos / ativos / arquivados
- Estado vazio: ilustração + CTA

### `src/views/projects/ProjectDetailView.vue`
- Header com logo, nome, cor, status
- Abas: Tarefas | Equipes | Lançamentos recentes
- Botão "Editar Projeto" (visível para admin/manager)
- Botão "Arquivar" com `ConfirmDialog`

### `src/components/projects/ProjectFormModal.vue`
Modal para criação e edição de projeto.

**Campos:**
- Nome (obrigatório)
- Descrição (opcional)
- Cor (color picker simples — input type="color" com preview) — validar hex
- Upload de logo (drag-and-drop ou browse) — apenas JPEG/PNG/WebP, max 2MB

**Validação com VeeValidate + Zod:**
- Nome: minLength 1, maxLength 150
- Cor: regex hex ou vazio

**Comportamento:**
- Criação: POST + atualiza store
- Edição: PATCH + atualiza store
- Upload de logo: separado via `projectsService.uploadLogo`

### Permissões visuais
- Botões de criação/edição/arquivamento ocultos para `member`
- Logo upload disponível apenas para `admin`/`manager`

## Critérios de conclusão
- [ ] Listagem exibe projetos com logo ou cor como fallback
- [ ] Criar projeto com cor inválida exibe erro no campo
- [ ] Arquivar projeto atualiza visual imediatamente (badge "Arquivado")
- [ ] Member não vê botões de criar/editar/arquivar
- [ ] Upload de logo atualiza sem recarregar a página
