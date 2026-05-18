# TASK-040 — Playwright: Specs de Timer e Lançamentos

## Objetivo
Implementar os testes E2E de browser para o fluxo de timer e registro de atividades.

## Escopo

### `e2e/timer.spec.ts`

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('iniciar timer com sucesso', async ({ memberPage: page }) => {
  await page.goto('/app/dashboard');
  await page.click('[data-testid="start-timer-btn"]');
  // Selecionar projeto no modal
  await page.selectOption('[data-testid="timer-project-select"]', { label: 'App Mobile' });
  await page.click('[data-testid="timer-submit-btn"]');
  // Verificar que cronômetro aparece na topbar
  await expect(page.locator('[data-testid="active-timer"]')).toBeVisible();
  await expect(page.locator('[data-testid="active-timer"]')).toContainText('App Mobile');
});

test('segundo timer bloqueado', async ({ memberPage: page }) => {
  // Já com timer ativo (via fixture)
  await page.click('[data-testid="start-timer-btn"]');
  await page.selectOption('[data-testid="timer-project-select"]', { label: 'App Mobile' });
  await page.click('[data-testid="timer-submit-btn"]');
  await expect(page.locator('[data-testid="toast"]')).toContainText('timer ativo');
});

test('parar timer calcula duração', async ({ memberPage: page }) => {
  // Timer já ativo
  await page.click('[data-testid="stop-timer-btn"]');
  // Verificar que cronômetro desaparece e lançamento aparece na lista
  await expect(page.locator('[data-testid="active-timer"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="time-entries-list"]').first()).toBeVisible();
});
```

### `e2e/time-entries.spec.ts`

```typescript
test('registro manual com sucesso', async ({ memberPage: page }) => {
  await page.goto('/app/time-entries');
  await page.click('[data-testid="add-entry-btn"]');
  // Preencher formulário
  await page.selectOption('[data-testid="entry-project"]', { label: 'App Mobile' });
  await page.fill('[data-testid="entry-date"]', '2026-05-14');
  await page.fill('[data-testid="entry-start"]', '09:00');
  await page.fill('[data-testid="entry-end"]', '11:00');
  await page.click('[data-testid="entry-submit"]');
  await expect(page.locator('[data-testid="time-entries-list"]')).toContainText('2h 00min');
});

test('data futura bloqueada no date picker', async ({ memberPage: page }) => {
  await page.goto('/app/time-entries');
  await page.click('[data-testid="add-entry-btn"]');
  // Verificar que data de amanhã está desabilitada
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dateInput = page.locator('[data-testid="entry-date"]');
  await expect(dateInput).toHaveAttribute('max', format(new Date(), 'yyyy-MM-dd'));
});

test('aviso de data retroativa exibido', async ({ memberPage: page }) => {
  await page.goto('/app/time-entries');
  await page.click('[data-testid="add-entry-btn"]');
  await page.fill('[data-testid="entry-date"]', '2026-01-01');
  await expect(page.locator('[data-testid="retro-warning"]')).toBeVisible();
  await expect(page.locator('[data-testid="entry-submit"]')).toBeEnabled();
});

test('fim anterior ao início exibe erro', async ({ memberPage: page }) => {
  // Preencher start=16:00, end=14:00
  // Verificar mensagem de erro
});
```

### Atributos `data-testid`
Para que os specs funcionem, todos os componentes relevantes devem ter `data-testid`:
- `start-timer-btn`, `stop-timer-btn`, `active-timer`
- `add-entry-btn`, `entry-project`, `entry-date`, `entry-start`, `entry-end`, `entry-submit`
- `time-entries-list`, `retro-warning`, `toast`

Adicionar os `data-testid` nos componentes Vue ao implementar TASK-032 e TASK-033.

## Critérios de conclusão
- [ ] `npx playwright test timer.spec.ts` passa todos os cenários
- [ ] `npx playwright test time-entries.spec.ts` passa todos os cenários
- [ ] Data futura realmente não pode ser selecionada
- [ ] Aviso retroativo aparece sem bloquear o submit
- [ ] Segundo timer exibe toast de erro
