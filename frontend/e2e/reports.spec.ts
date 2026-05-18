import { test, expect } from './fixtures/auth.fixture'

test.describe('Relatórios', () => {
  test('relatório diário exibe o gráfico e tabela', async ({ memberPage: page }) => {
    await page.goto('/app/reports/daily')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="daily-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="daily-entries-table"]')).toBeVisible()
  })

  test('relatório diário sem dados exibe estado vazio', async ({ memberPage: page }) => {
    await page.goto('/app/reports/daily')
    await page.fill('[data-testid="date-picker"]', '2020-01-01')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 5000 })
  })

  test('member não vê dropdown de usuário no relatório', async ({ memberPage: page }) => {
    await page.goto('/app/reports/daily')
    await expect(page.locator('[data-testid="user-selector"]')).not.toBeVisible()
  })

  test('admin vê dropdown de usuário no relatório', async ({ adminPage: page }) => {
    await page.goto('/app/reports/daily')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="user-selector"]')).toBeVisible()
  })

  test('relatório mensal renderiza a página', async ({ memberPage: page }) => {
    await page.goto('/app/reports/monthly')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="month-label"]')).toBeVisible()
    await expect(page.locator('[data-testid="prev-month-btn"]')).toBeVisible()
  })

  test('botão próximo mês desabilitado no mês atual', async ({ memberPage: page }) => {
    await page.goto('/app/reports/monthly')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="next-month-btn"]')).toBeDisabled()
  })

  test('relatório mensal navega para o mês anterior', async ({ memberPage: page }) => {
    await page.goto('/app/reports/monthly')
    await page.waitForLoadState('networkidle')
    const monthInput = page.locator('[data-testid="month-label"]')
    const currentValue = await monthInput.inputValue()
    // Click previous month
    await page.click('[data-testid="prev-month-btn"]')
    await page.waitForLoadState('networkidle')
    // Compute expected previous month value
    const [year, month] = currentValue.split('-').map(Number)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const expectedValue = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
    await expect(monthInput).toHaveValue(expectedValue)
    // Next month button should now be enabled
    await expect(page.locator('[data-testid="next-month-btn"]')).toBeEnabled()
  })
})
