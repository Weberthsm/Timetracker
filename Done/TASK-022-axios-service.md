# TASK-022 — Axios: Serviço HTTP e Interceptors

## Objetivo
Configurar o cliente HTTP Axios com interceptors de autenticação e tratamento global de erros.

## Escopo

### `src/services/api.ts`
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

### Interceptor de Requisição
- Antes de cada request: ler token do localStorage (`auth_token`)
- Se token existir: adicionar `Authorization: Bearer <token>` ao header

### Interceptor de Resposta
Tratar cada código de erro:
- **401**: limpar token do localStorage, redirecionar para `/login` via `router.push`
- **403**: exibir toast "Acesso não permitido"
- **422**: extrair `details` da resposta e retornar como `ValidationError` para o formulário tratar
- **429**: exibir toast "Muitas tentativas. Aguarde antes de tentar novamente."
- **4xx** (outros): exibir toast com `response.data.message` ou mensagem genérica
- **5xx**: exibir toast "Erro interno. Tente novamente."
- **Erro de rede** (sem resposta): exibir toast "Sem conexão com o servidor."

### Exportar instância
```typescript
export default api;
```

### `src/services/auth.service.ts`
```typescript
import api from './api';
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};
```

### Dependência do Toast
- O interceptor deve chamar um serviço de toast que será implementado em TASK-026
- Usar um EventBus ou importação circular cuidadosa (preferir injeção via função callback)

### `src/test/setup.ts`
- Configurar MSW para interceptar chamadas em testes unitários
- `beforeAll(() => server.listen())`
- `afterEach(() => server.resetHandlers())`
- `afterAll(() => server.close())`

## Critérios de conclusão
- [ ] Token adicionado automaticamente a todas as requisições autenticadas
- [ ] 401 limpa token e redireciona para /login
- [ ] 422 retorna `details` acessível nos componentes de formulário
- [ ] 5xx exibe toast genérico
- [ ] MSW configurado nos testes (mock de `api.get`, `api.post`)
