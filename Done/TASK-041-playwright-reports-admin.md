# TASK-041 — Playwright: Specs de Relatórios e Admin

## Objetivo
Implementar os testes E2E de browser para relatórios e funcionalidades administrativas.

## Escopo

### `e2e/reports.spec.ts`

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('relatório diário exibe percentuais', async ({ memberPage: page }) => {
  await page.goto('/app/reports/daily');
  // Verificar gráfico carregado
  await expect(page.locator('[data-testid="daily-chart"]')).toBeVisible();
  // Verificar que tabela de atividades está presente
  await expect(page.locator('[data-testid="daily-entries-table"]')).toBeVisible();
});

test('relatório diário sem dados exibe estado vazio', async ({ memberPage: page }) => {
  // Navegar para data sem dados
  await page.goto('/app/reports/daily');
  await page.fill('[data-testid="date-picker"]', '2020-01-01');
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
});

test('member não vê dropdown de usuário no relatório', async ({ memberPage: page }) => {
  await page.goto('/app/reports/daily');
  await expect(page.locator('[data-testid="user-selector"]')).not.toBeVisible();
});

test('manager vê dropdown de usuário no relatório', async ({ adminPage: page }) => {
  await page.goto('/app/reports/daily');
  await expect(page.locator('[data-testid="user-selector"]')).toBeVisible();
});

test('relatório mensal navega entre meses', async ({ memberPage: page }) => {
  await page.goto('/app/reports/monthly');
  await page.click('[data-testid="prev-month-btn"]');
  // Verificar que URL ou título atualiza para mês anterior
  await expect(page.locator('[data-testid="month-label"]')).toContainText('abril');
});
```

### `e2e/admin.spec.ts`

```typescript
test('admin acessa configurações', async ({ adminPage: page }) => {
  await page.goto('/app/settings');
  await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();
});

test('admin desativa verificação de e-mail', async ({ adminPage: page }) => {
  await page.goto('/app/settings');
  const toggle = page.locator('[data-testid="require-email-verification-toggle"]');
  await toggle.click(); // desativa
  await expect(page.locator('[data-testid="toast"]')).toContainText('atualiz');
});

test('member redirecionado ao tentar acessar settings', async ({ memberPage: page }) => {
  await page.goto('/app/settings');
  await expect(page).not.toHaveURL('/app/settings');
  await expect(page).toHaveURL('/app/dashboard');
});

test('admin cria e testa webhook', async ({ adminPage: page }) => {
  await page.goto('/app/settings'); // ou rota de webhooks
  await page.click('[data-testid="new-webhook-btn"]');
  await page.fill('[data-testid="webhook-name"]', 'Teste Webhook');
  await page.fill('[data-testid="webhook-url"]', 'https://webhook.site/test');
  await page.click('[data-testid="webhook-submit"]');
  await expect(page.locator('[data-testid="webhooks-list"]')).toContainText('Teste Webhook');
});

test('member não vê link de equipes na sidebar', async ({ memberPage: page }) => {
  await page.goto('/app/dashboard');
  await expect(page.locator('[data-testid="sidebar-teams-link"]')).not.toBeVisible();
});
```

### Atributos `data-testid` adicionais
Adicionar nos componentes Vue durante implementação:
- `daily-chart`, `daily-entries-table`, `date-picker`, `user-selector`, `empty-state`
- `month-label`, `prev-month-btn`, `next-month-btn`
- `settings-form`, `require-email-verification-toggle`
- `new-webhook-btn`, `webhook-name`, `webhook-url`, `webhook-submit`, `webhooks-list`
- `sidebar-teams-link`, `sidebar-settings-link`

## Critérios de conclusão
- [ ] `npx playwright test reports.spec.ts` passa todos os cenários
- [ ] `npx playwright test admin.spec.ts` passa todos os cenários
- [ ] Member redirecionado de /settings para /dashboard
- [ ] Gráfico diário visível com dados reais
- [ ] Navegação de mês funciona corretamente
- [ ] `npx playwright show-report` exibe relatório com screenshots/videos
