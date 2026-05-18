# TASK-024 — Views de Autenticação (Login, Cadastro, Verificação)

## Objetivo
Criar as telas de autenticação com formulários validados e integração com a API.

## Escopo

### `src/views/auth/LoginView.vue`
**Campos:** e-mail, senha
**Validação (VeeValidate + Zod):**
- e-mail: obrigatório, formato válido
- senha: obrigatória

**Comportamento:**
1. Submit → `authStore.login({ email, password })`
2. Sucesso: redirecionar para `/app/dashboard`
3. Erro 403 (e-mail não verificado): exibir mensagem com link "Reenviar e-mail de confirmação"
4. Erro 401: exibir "Credenciais inválidas" abaixo do formulário
5. Loading state no botão durante a requisição

**Links:**
- "Esqueci minha senha" → `/forgot-password`
- "Criar conta" → `/register`

### `src/views/auth/RegisterView.vue`
**Campos:** nome, e-mail, senha, confirmação de senha
**Validação:**
- nome: 2–150 caracteres
- e-mail: formato válido
- senha: mínimo 8 caracteres
- confirmação: deve ser igual à senha

**Comportamento:**
1. Submit → `authService.register(data)`
2. Sucesso: redirecionar para `/register-success` (tela de aviso)
3. Erro 409: exibir "E-mail já cadastrado" no campo de e-mail
4. Erro 422: exibir erros nos campos correspondentes via `details`

### `src/views/auth/RegisterSuccessView.vue`
- Tela simples informando para verificar o e-mail
- Botão "Reenviar e-mail" → chama `authService.resendVerification(email)`
- Feedback de rate limit (429)

### `src/views/auth/VerifyEmailView.vue`
- Lê `token` da query string (`?token=...`)
- Automaticamente chama `authService.verifyEmail(token)` ao montar
- Loading state durante verificação
- Sucesso: exibir mensagem + link para login
- Erro: exibir mensagem + link para reenviar

### `src/views/auth/ForgotPasswordView.vue`
**Campo:** e-mail
**Comportamento:** chama API, exibe mensagem genérica de sucesso (independente de e-mail existir)

### `src/views/auth/ResetPasswordView.vue`
**Campos:** nova senha, confirmar senha
- Lê `token` da query string
- Validação: mínimo 8 caracteres, confirmação igual
- Sucesso: redirecionar para login com toast de sucesso

### Testes unitários (`LoginView.spec.ts`)
- Submeter com campos vazios exibe erros de validação
- Submeter com credenciais inválidas exibe mensagem de erro
- Sucesso redireciona para dashboard

## Critérios de conclusão
- [ ] Login funcional com redirecionamento para dashboard
- [ ] Erros de validação exibidos nos campos corretos
- [ ] Fluxo completo register → verify-email → login funciona
- [ ] Tela de reset de senha atualiza e redireciona
- [ ] Loading state visível durante requisições
