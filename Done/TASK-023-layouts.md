# TASK-023 — Layouts: AuthLayout e AppLayout

## Objetivo
Criar os dois layouts base da aplicação: um para telas de autenticação e um para telas protegidas com sidebar e topbar.

## Escopo

### `src/layouts/AuthLayout.vue`
- Fundo neutro (cinza claro)
- Conteúdo centralizado verticalmente e horizontalmente
- Logo/nome da aplicação no topo
- `<RouterView />` no centro
- Sem sidebar nem navbar

### `src/layouts/AppLayout.vue`
Estrutura: sidebar fixa à esquerda + área principal com topbar e conteúdo.

**Sidebar:**
- Logo da aplicação no topo
- Links de navegação:
  - Dashboard (`/dashboard`)
  - Projetos (`/projects`)
  - Equipes (`/teams`) — visível para admin/manager
  - Lançamentos (`/time-entries`)
  - Relatórios (`/reports`)
  - Configurações (`/settings`) — visível apenas para admin
- Nome e avatar do usuário no rodapé com link para perfil
- Responsivo: colapsável em mobile (hamburger menu)

**Topbar:**
- Componente placeholder `<ActiveTimer />` à direita (implementado em TASK-032)
- Avatar do usuário logado com dropdown (Perfil, Sair)
- Título da página atual (via `useRoute().meta.title`)

**`<RouterView />` no conteúdo principal**

### `src/router/index.ts` — estrutura inicial
```typescript
const routes = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: 'login', name: 'login', component: LoginView },
      { path: 'register', name: 'register', component: RegisterView },
      // ... outras rotas públicas
    ],
  },
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'dashboard', component: DashboardView },
      // ... outras rotas protegidas
    ],
  },
  { path: '/', redirect: '/login' },
];
```

### Integração com Pinia Auth Store
- `AppLayout` verifica `authStore.user` para exibir nome e avatar
- Sidebar oculta itens baseado em `authStore.user.role`

## Critérios de conclusão
- [ ] `AuthLayout` renderiza sem sidebar/navbar
- [ ] `AppLayout` renderiza com sidebar, topbar e `<RouterView />`
- [ ] Links da sidebar navegam corretamente
- [ ] Sidebar oculta "Equipes" para member
- [ ] Sidebar oculta "Configurações" para não-admin
- [ ] Layout responsivo funciona em mobile (sidebar colapsável)
