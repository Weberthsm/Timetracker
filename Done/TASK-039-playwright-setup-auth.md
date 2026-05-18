# TASK-039 — Playwright: Setup, Fixtures e Spec de Auth

## Objetivo
Configurar o Playwright e implementar o spec de autenticação (cadastro, verificação, login).

## Escopo

### Instalar Playwright
```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

### `e2e/playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  use: {
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### `e2e/fixtures/auth.fixture.ts`
```typescript
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  adminPage: Page;
  memberPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Login via API diretamente para evitar UI
    await loginViaApi(page, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD);
    await use(page);
    await context.close();
  },
  memberPage: async ({ browser }, use) => {
    // Similar para member
  },
});
```

### `e2e/auth.spec.ts`
```typescript
test('cadastro com sucesso', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="name"]', 'Usuário Teste');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'senha1234');
  await page.fill('[name="confirmPassword"]', 'senha1234');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/register-success');
});

test('cadastro com e-mail duplicado exibe erro', async ({ page }) => { ... });

test('login com credenciais inválidas exibe mensagem', async ({ page }) => { ... });

test('login com sucesso redireciona para dashboard', async ({ page }) => { ... });

test('acesso sem token redireciona para login', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL('/login');
});

test('recuperação de senha exibe mensagem genérica', async ({ page }) => { ... });
```

### `e2e/.env.test`
```env
PLAYWRIGHT_BASE_URL=http://localhost:5173
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=admin1234
```

## Critérios de conclusão
- [ ] `npx playwright test auth.spec.ts` passa todos os cenários
- [ ] Screenshots capturados em falhas
- [ ] Fixtures de login funcionam sem depender da UI de login
- [ ] Testes independentes entre si (sem estado compartilhado)
