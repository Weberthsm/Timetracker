# TimeTracker — Frontend

Interface web do sistema de controle de horas, construída com Vue 3 e Vite.

---

## Stack tecnológica

| Camada                  | Tecnologia                        | Versão  |
|-------------------------|-----------------------------------|---------|
| Framework               | Vue 3 (Composition API)           | 3.5.x   |
| Linguagem               | TypeScript                        | 6.x     |
| Build tool              | Vite                              | 8.x     |
| Gerenciamento de estado | Pinia                             | 3.x     |
| Roteamento              | Vue Router                        | 4.x     |
| Estilização             | Tailwind CSS                      | 4.x     |
| HTTP Client             | Axios                             | 1.x     |
| Gráficos                | Chart.js + vue-chartjs            | 4.x / 5.x |
| Validação de formulários| VeeValidate + Zod                 | 4.x / 3.x |
| Datas                   | date-fns                          | 4.x     |
| Testes unitários        | Vitest + @vue/test-utils          | 4.x     |
| Testes mock de API      | MSW (Mock Service Worker)         | 2.x     |
| Testes E2E de browser   | Playwright                        | 1.60.x  |
| Runtime                 | Node.js                           | ≥ 20.x  |

---

## Pré-requisitos

- **Node.js** ≥ 20 — [nodejs.org](https://nodejs.org)
- **npm** ≥ 10
- **Backend rodando** em `http://localhost:3000` (ou URL configurada)

---

## Instalação

```bash
cd frontend
npm install
```

---

## Variáveis de ambiente

Crie o arquivo `.env` na pasta `frontend/` com base no exemplo abaixo:

```env
# URL base da API (backend)
VITE_API_BASE_URL=http://localhost:3000
```

Para os testes E2E com Playwright, crie também o arquivo `e2e/.env.test`:

```env
PLAYWRIGHT_BASE_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000
TEST_ADMIN_EMAIL=admin@empresa.com
TEST_ADMIN_PASSWORD=SenhaForte@123
TEST_MEMBER_EMAIL=membro@empresa.com
TEST_MEMBER_PASSWORD=SenhaForte@123
```

> Os usuários de teste precisam existir no banco. Use o seed do backend para criar o admin e crie o membro manualmente ou via outro seed.

---

## Executando a aplicação

### Desenvolvimento (hot-reload)

```bash
npm run dev
```

> Aplicação disponível em `http://localhost:5173`

### Build de produção

```bash
npm run build
```

> Arquivos gerados em `dist/`.

### Pré-visualizar o build

```bash
npm run preview
```

> Serve os arquivos de `dist/` localmente para validação antes do deploy.

---

## Testes

### Testes unitários

```bash
npm run test
```

> Roda o Vitest com `jsdom` e cobertura via @vitest/coverage-v8.

### Testes unitários com cobertura

```bash
npm run test:coverage
```

> Relatório gerado em `coverage/`.

### Testes E2E com Playwright

**Pré-requisito:** backend rodando e banco populado com usuários de teste.

```bash
# Instalar os browsers do Playwright (apenas uma vez)
npx playwright install

# Rodar todos os testes E2E
npx playwright test

# Rodar com interface visual
npx playwright test --ui

# Rodar um arquivo específico
npx playwright test e2e/timer.spec.ts

# Ver relatório após a execução
npx playwright show-report
```

---

## Estrutura do projeto

```
frontend/
├── e2e/                        # Testes E2E com Playwright
│   ├── fixtures/
│   │   └── auth.fixture.ts     # Login via API (sem UI) para fixtures
│   ├── auth.spec.ts            # Fluxo de autenticação
│   ├── timer.spec.ts           # Timer e cronômetro
│   ├── time-entries.spec.ts    # Lançamentos de horas
│   ├── reports.spec.ts         # Relatórios diário e mensal
│   └── admin.spec.ts           # Configurações e webhooks (admin)
├── src/
│   ├── assets/                 # Imagens e fontes estáticas
│   ├── components/
│   │   ├── charts/             # BarChart, DoughnutChart, StackedBarChart
│   │   ├── time-entries/       # TimeEntryFormModal
│   │   ├── timer/              # ActiveTimer, StartTimerModal
│   │   └── ui/                 # BaseButton, BaseModal, BasePagination,
│   │                           # ToastContainer e demais componentes genéricos
│   ├── composables/            # useAuth, useTimer, useToast
│   ├── layouts/                # AppLayout, AuthLayout
│   ├── router/                 # Definição de rotas e guards de navegação
│   ├── services/               # Clients Axios por domínio (api, auth, projects…)
│   ├── stores/                 # Pinia: auth, projects, tasks, teams, timeEntries
│   ├── test/                   # Setup do Vitest e mocks globais
│   └── views/
│       ├── auth/               # Login, Register, ForgotPassword, ResetPassword
│       ├── dashboard/          # Dashboard, Profile, Settings (+ Webhooks)
│       ├── projects/           # ProjectsView, ProjectDetailView
│       ├── reports/            # DailyReport, MonthlyReport, TeamReport
│       ├── teams/              # TeamsView, TeamDetailView
│       └── time-entries/       # TimeEntriesView
├── playwright.config.ts        # Configuração do Playwright
└── vite.config.ts              # Configuração do Vite + Vitest
```

---

## Funcionalidades principais

- **Timer em tempo real** — iniciar/parar com projeto e tarefa, cronômetro exibido na topbar
- **Lançamentos manuais** — registro de horas passadas com validação de data futura/retroativa
- **Dashboard** — resumo diário, projetos recentes e timer ativo
- **Relatório diário** — gráfico de pizza por projeto + tabela de atividades
- **Relatório mensal** — gráfico de barras por dia, tabela de projetos com % do mês, distribuição diária expansível
- **Relatório de equipe** — comparativo de horas entre membros, gráfico empilhado por projeto, alerta de desequilíbrio
- **Projetos e Tarefas** — CRUD com kanban de status (`todo / in_progress / done / cancelled`)
- **Equipes** — gerenciamento de membros por admin/manager
- **Paginação** — todas as listagens paginadas com componente `BasePagination`
- **Refresh token** — renovação automática de sessão com fila de requisições concorrentes
- **Webhooks** — criação e gerenciamento de integrações HTTP (apenas admin)

---

## Convenções de código

- Componentes em **PascalCase**: `BaseButton.vue`, `ActiveTimer.vue`
- Composables em **camelCase** com prefixo `use`: `useTimer.ts`, `useToast.ts`
- Serviços com sufixo `.service.ts`: `projects.service.ts`
- Stores com sufixo `Store`: `useProjectsStore`
- Atributos `data-testid` obrigatórios em todos os elementos alvos de testes E2E
