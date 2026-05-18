# TASK-027 — Componentes UI Base

## Objetivo
Criar os componentes de interface reutilizáveis usados em toda a aplicação.

## Escopo

### `src/components/ui/BaseButton.vue`
Props: `variant` ('primary' | 'secondary' | 'danger' | 'ghost'), `size` ('sm' | 'md' | 'lg'), `loading` (boolean), `disabled` (boolean), `type` ('button' | 'submit')

- `loading = true`: exibe spinner e desabilita o botão
- Variantes com cores Tailwind consistentes
- `<slot />` para conteúdo

### `src/components/ui/BaseInput.vue`
Props: `label`, `error`, `hint`, `type`, `placeholder`, `modelValue`, `disabled`

- Label acima do input
- Borda vermelha + mensagem de erro abaixo quando `error` preenchido
- `v-model` via `emit('update:modelValue')`
- Hint (texto cinza) exibido quando não há erro

### `src/components/ui/BaseModal.vue`
Props: `open` (boolean), `title`, `size` ('sm' | 'md' | 'lg')
Emits: `close`

- Usando `<Teleport to="body">`
- Overlay escuro com `z-50`
- Fechar com tecla Escape e clique no overlay
- Animação de fade/scale
- `<slot />` para conteúdo + `<slot name="footer" />` para botões

### `src/components/ui/BaseBadge.vue`
Props: `variant` ('success' | 'warning' | 'error' | 'info' | 'neutral'), `size` ('sm' | 'md')

Usado para status de projetos (`active`/`archived`) e tarefas (`todo`/`in_progress`/`done`/`cancelled`).

### `src/components/ui/ToastContainer.vue`
- Renderizado uma única vez em `App.vue`
- Escuta eventos do `useToast`
- Exibe lista de toasts no canto superior direito
- Auto-remove após `duration` ms
- Animação de slide-in/fade-out
- Ícone + cor por tipo (success: verde, error: vermelho, warning: amarelo, info: azul)

### `src/components/ui/BaseAvatar.vue`
Props: `src` (string | null), `name` (string), `size` ('sm' | 'md' | 'lg')

- Se `src`: exibe `<img>` com `object-fit: cover` e borda circular
- Se `src = null`: exibe iniciais do `name` com cor de fundo gerada a partir do nome (hash)

### `src/components/ui/ConfirmDialog.vue`
Props: `open`, `title`, `message`, `confirmLabel` (padrão "Confirmar"), `confirmVariant` (padrão 'danger')
Emits: `confirm`, `cancel`

- Modal de confirmação genérico (usado em exclusões)

## Critérios de conclusão
- [ ] `BaseButton` exibe spinner quando `loading = true`
- [ ] `BaseInput` exibe erro vermelho com mensagem
- [ ] `BaseModal` fecha com Escape e clique no overlay
- [ ] `ToastContainer` exibe e auto-remove toasts
- [ ] `BaseAvatar` exibe iniciais quando sem foto
- [ ] Todos os componentes tipados com TypeScript (`defineProps<{...}>()`)
