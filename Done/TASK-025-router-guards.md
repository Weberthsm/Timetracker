# TASK-025 — Router: Guards de Autenticação e Autorização

## Objetivo
Configurar o Vue Router com guards que protegem rotas autenticadas e por role.

## Escopo

### `src/router/index.ts` — configuração completa das rotas

**Rotas públicas** (dentro do `AuthLayout`):
- `/login` → `LoginView`
- `/register` → `RegisterView`
- `/register-success` → `RegisterSuccessView`
- `/verify-email` → `VerifyEmailView`
- `/forgot-password` → `ForgotPasswordView`
- `/reset-password` → `ResetPasswordView`

**Rotas protegidas** (dentro do `AppLayout`, `meta: { requiresAuth: true }`):
- `/app/dashboard` → `DashboardView`
- `/app/projects` → `ProjectsView`
- `/app/projects/:id` → `ProjectDetailView`
- `/app/teams` → `TeamsView` — `meta: { roles: ['admin', 'manager'] }`
- `/app/time-entries` → `TimeEntriesView`
- `/app/reports/daily` → `DailyReportView`
- `/app/reports/monthly` → `MonthlyReportView`
- `/app/reports/team` → `TeamReportView` — `meta: { roles: ['admin', 'manager'] }`
- `/app/settings` → `SettingsView` — `meta: { roles: ['admin'] }`
- `/app/profile` → `ProfileView`

**Catch-all:** `/` redireciona para `/login`

### Guard global `beforeEach`
```typescript
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();
  
  // 1. Rota requer autenticação?
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }
  
  // 2. Usuário já logado tenta acessar rota de auth?
  if (!to.meta.requiresAuth && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }
  
  // 3. Rota exige role específico?
  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    return { name: 'dashboard' }; // redireciona silenciosamente
  }
  
  // 4. Primeiro acesso: carregar perfil se token existe mas store vazio
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchCurrentUser();
    } catch {
      authStore.logout();
      return { name: 'login' };
    }
  }
});
```

### Tipos TypeScript para meta de rota
```typescript
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: Role[];
    title?: string;
  }
}
```

## Critérios de conclusão
- [ ] Acesso a `/app/dashboard` sem token redireciona para `/login`
- [ ] Usuário autenticado tentando acessar `/login` vai para `/dashboard`
- [ ] Member tentando acessar `/app/settings` vai para `/dashboard`
- [ ] Refresh da página: token existente recarrega perfil antes de continuar
- [ ] Token expirado (401 na API): usuário redirecionado para login
