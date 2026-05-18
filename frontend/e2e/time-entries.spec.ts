import { test, expect } from './fixtures/auth.fixture'
import { format, addDays, subDays } from 'date-fns'

test.describe('Lançamentos de horas', () => {
  test('registro manual — formulário abre ao clicar em Adicionar', async ({ memberPage: page }) => {
    await page.goto('/app/time-entries')
    await page.click('[data-testid="add-entry-btn"]')
    await expect(page.locator('[data-testid="entry-project"]')).toBeVisible()
    await expect(page.locator('[data-testid="entry-date"]')).toBeVisible()
  })

  test('registro manual com sucesso — entrada aparece na lista', async ({ memberPage: page }) => {
    await page.goto('/app/time-entries')
    await page.click('[data-testid="add-entry-btn"]')

    const projectSelect = page.locator('[data-testid="entry-project"]')
    await expect(projectSelect).toBeVisible()
    const projectOptions = await projectSelect.locator('option').all()
    if (projectOptions.length <= 1) { test.skip(); return }

    await projectSelect.selectOption({ index: 1 })
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    await page.fill('[data-testid="entry-date"]', yesterday)
    await page.fill('[data-testid="entry-start"]', '09:00')
    await page.fill('[data-testid="entry-end"]', '11:00')

    await page.click('[data-testid="entry-submit"]')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-testid="time-entries-list"]')).toContainText('2h 00min', { timeout: 6000 })
  })

  test('data futura está bloqueada no date picker', async ({ memberPage: page }) => {
    await page.goto('/app/time-entries')
    await page.click('[data-testid="add-entry-btn"]')
    const dateInput = page.locator('[data-testid="entry-date"]')
    await expect(dateInput).toHaveAttribute('max', format(new Date(), 'yyyy-MM-dd'))
  })

  test('aviso de data retroativa exibido sem bloquear submit', async ({ memberPage: page }) => {
    await page.goto('/app/time-entries')
    await page.click('[data-testid="add-entry-btn"]')
    await page.fill('[data-testid="entry-date"]', '2024-01-01')
    await expect(page.locator('[data-testid="retro-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="entry-submit"]')).toBeVisible()
  })

  test('fim anterior ao início exibe erro de validação', async ({ memberPage: page }) => {
    await page.goto('/app/time-entries')
    await page.click('[data-testid="add-entry-btn"]')
    await page.fill('[data-testid="entry-start"]', '16:00')
    await page.fill('[data-testid="entry-end"]', '14:00')
    await expect(page.locator('text=Fim deve ser')).toBeVisible()
    await expect(page.locator('[data-testid="entry-submit"]')).toBeDisabled()
  })

  test('lista de lançamentos é exibida', async ({ memberPage: page }) => {
    await page.goto('/app/time-entries')
    await page.waitForLoadState('networkidle')
    const list = page.locator('[data-testid="time-entries-list"]')
    const empty = page.locator('text=Nenhum lançamento')
    const visible = await list.isVisible()
    const hasEmpty = await empty.isVisible()
    expect(visible || hasEmpty).toBeTruthy()
  })
})
