# TimeTracker — Contexto do Projeto

Leia o plano completo em `docs/plano-timetracker.md` antes de qualquer implementação.
Todas as decisões de arquitetura, modelos, endpoints, histórias de usuário e estratégia de testes estão documentadas lá.

---

## Decisões fixadas

**Linguagem:** TypeScript em todo o projeto (backend e frontend). Nenhum arquivo `.js` no código-fonte.

**Backend:**
- NestJS 10 + Prisma 5 + PostgreSQL 16
- ORM: Prisma (não TypeORM) — schema.prisma é a fonte única de verdade
- Auth: JWT via @nestjs/passport; guard global JwtAuthGuard; rotas públicas com @Public()
- Admin inicial: criado via `npx prisma db seed` usando variáveis de ambiente (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD)
- Envio de e-mail: Nodemailer com SMTP configurável via .env
- Upload de imagens: Multer; armazenamento local em dev, S3 em produção

**Frontend:**
- Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS
- HTTP client: Axios com interceptor global de erros
- Validação de formulários: VeeValidate + Zod
- Gráficos: Chart.js + vue-chartjs

**Testes:**
- Backend unitários: Jest + jest-mock-extended (Prisma sempre mockado)
- Backend e2e de API: Jest + Supertest (pasta `test/`)
- Frontend unitários: Vitest + @vue/test-utils + msw
- Browser e2e: Playwright (pasta `e2e/` no frontend)
- Convenção: `*.spec.ts` ao lado de cada `*.service.ts` e `*.controller.ts`

---

## Estrutura dos repositórios

```
backend/               → NestJS + Prisma
├── src/               → módulos: auth, users, teams, projects, tasks,
│                        time-entries, upload, settings, webhooks, mail, prisma
├── test/              → e2e Jest + Supertest
├── prisma/            → schema.prisma, migrations/, seed.ts
└── resources/         → swagger.yaml

frontend/              → Vue 3 + Vite
├── src/               → router, stores, services, composables, layouts, views, components
└── e2e/               → Playwright specs
```

---

## Roles e permissões

| Ação | admin | manager | member |
|---|---|---|---|
| Gerenciar equipes | ✅ | ✅ | ❌ |
| Gerenciar projetos | ✅ | ✅ | ❌ |
| Ver relatórios da equipe | ✅ | ✅ | ❌ |
| Gerenciar tarefas | ✅ | ✅ | ✅ |
| Registrar horas | ✅ | ✅ | ✅ |
| Atualizar próprio avatar | ✅ | ✅ | ✅ |
| Atualizar logo do projeto | ✅ | ✅ | ❌ |
| Promover/rebaixar role | ✅ | ❌ | ❌ |
| Configurações do sistema | ✅ | ❌ | ❌ |
| Gerenciar webhooks | ✅ | ❌ | ❌ |

---

## Variáveis de ambiente obrigatórias

```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/timetracker
JWT_SECRET=...
JWT_EXPIRES_IN=15m
PORT=3000
ADMIN_NAME=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
MAIL_HOST=...
MAIL_PORT=587
MAIL_USER=...
MAIL_PASS=...
MAIL_FROM="TimeTracker <no-reply@empresa.com>"
APP_URL=http://localhost:5173

# Frontend
VITE_API_BASE_URL=http://localhost:3000
```

---

## Comandos essenciais

```bash
# Setup do banco
npx prisma migrate dev
npx prisma db seed

# Testes backend
npm run test          # unitários
npm run test:cov      # com cobertura
npm run test:e2e      # e2e API

# Testes frontend
npm run test
npm run test:coverage

# Playwright
npx playwright test
npx playwright test --ui
```

---

## Fases de implementação (resumo)

- **Fase 1:** Fundação backend — Auth, Users, Teams, Projects, Tasks + testes + Swagger
- **Fase 2:** TimeEntries, Reports, Upload, Settings, Webhooks + testes e2e de API
- **Fase 3:** Frontend base — layouts, auth, composables, componentes UI
- **Fase 4:** Frontend funcional — dashboard, módulos, timer, relatórios
- **Fase 5:** Refinamentos + Playwright + revisão de cobertura
