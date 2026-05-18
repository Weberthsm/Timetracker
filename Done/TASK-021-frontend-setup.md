# TASK-021 — Setup do Projeto Frontend

## Objetivo
Inicializar o projeto Vue 3 com todas as dependências e ferramentas configuradas.

## Escopo

### Criar projeto
```bash
npm create vite@latest frontend -- --template vue-ts
cd frontend
```

### Instalar dependências de produção
```bash
npm install vue-router@4
npm install pinia
npm install axios
npm install vee-validate @vee-validate/zod zod
npm install chart.js vue-chartjs
npm install date-fns
npm install @headlessui/vue
```

### Instalar Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configurar `tailwind.config.js`:
```js
content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
```

Adicionar em `src/style.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Instalar dependências de desenvolvimento/teste
```bash
npm install -D vitest @vitest/coverage-v8
npm install -D @vue/test-utils @testing-library/vue
npm install -D msw
npm install -D eslint prettier eslint-plugin-vue @typescript-eslint/eslint-plugin
```

### Configurar `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### Criar `.env.example`
```env
VITE_API_BASE_URL=http://localhost:3000
```

### Estrutura de pastas inicial
Criar pastas vazias conforme seção 7 do plano:
`src/router/`, `src/stores/`, `src/services/`, `src/composables/`, `src/layouts/`, `src/views/auth/`, `src/views/dashboard/`, `src/views/projects/`, `src/views/teams/`, `src/views/tasks/`, `src/views/time-entries/`, `src/views/reports/`, `src/components/ui/`, `src/components/timer/`, `src/components/charts/`, `src/components/reports/`, `src/test/`, `e2e/`

### Configurar `tsconfig.json`
- `strict: true`
- `paths`: `@/*` → `./src/*`

## Critérios de conclusão
- [ ] `npm run dev` inicia servidor Vite sem erros
- [ ] `npm run build` compila sem erros TypeScript
- [ ] `npm run test` executa Vitest (sem specs ainda)
- [ ] Tailwind funciona (classe `text-blue-500` aplicada)
- [ ] Alias `@/` funciona nos imports
