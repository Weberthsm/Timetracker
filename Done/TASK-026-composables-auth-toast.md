# TASK-026 — Composables: useAuth, useToast e Auth Store

## Objetivo
Criar a store de autenticação Pinia e os composables reutilizáveis de auth e toast, com testes unitários.

## Escopo

### `src/stores/auth.ts` (Pinia store)
```typescript
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(credentials: LoginDto) { ... }
  async function logout() { token.value = null; user.value = null; localStorage.removeItem('auth_token'); }
  async function fetchCurrentUser() { ... }
  function setToken(newToken: string) { token.value = newToken; localStorage.setItem('auth_token', newToken); }

  return { token, user, isAuthenticated, login, logout, fetchCurrentUser, setToken };
});
```

**`login(credentials)`:**
1. Chamar `authService.login(credentials)`
2. Salvar token no localStorage e no store
3. Chamar `fetchCurrentUser()`
4. Em caso de erro: propagar o erro para a view tratar

**`fetchCurrentUser()`:**
1. Chamar `authService.me()`
2. Salvar `user` no store
3. Em caso de 401: chamar `logout()`

### `src/composables/useAuth.ts`
```typescript
export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();

  async function login(credentials: LoginDto) {
    await authStore.login(credentials);
    await router.push({ name: 'dashboard' });
  }

  async function logout() {
    authStore.logout();
    await router.push({ name: 'login' });
  }

  return { login, logout, user: authStore.user, isAuthenticated: authStore.isAuthenticated };
}
```

### `src/composables/useToast.ts`
```typescript
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 4000) { ... }
  function success(message: string) { show(message, 'success'); }
  function error(message: string) { show(message, 'error'); }
  function warning(message: string) { show(message, 'warning'); }

  return { show, success, error, warning };
}
```

- Usa `EventBus` ou store reativa simples para comunicar com `Toast.vue` (componente de TASK-027)

### Testes unitários

**`auth.store.spec.ts`**
- `login`: token salvo no localStorage
- `login`: user preenchido após fetchCurrentUser
- `logout`: limpa token e user do localStorage
- `fetchCurrentUser`: 401 chama logout

**`useAuth.spec.ts`** (com MSW mockando a API)
- `login`: redireciona para dashboard após sucesso
- `logout`: limpa store e redireciona para login

**`useToast.spec.ts`**
- `success`: emite evento com tipo 'success'
- `error`: emite evento com tipo 'error'

## Critérios de conclusão
- [ ] Token persiste no localStorage entre refreshes
- [ ] `logout()` limpa localStorage e redireciona
- [ ] `useToast.success()` exibe toast de sucesso
- [ ] Todos os cenários de teste passam
