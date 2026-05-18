import { test, expect } from './fixtures/auth.fixture'

test.describe('Timer', () => {
  test('iniciar timer com sucesso', async ({ memberPage: page }) => {
    await page.goto('/app/dashboard')
    await page.click('[data-testid="start-timer-btn"]')
    await page.waitForSelector('[data-testid="timer-project-select"]')
    const options = await page.locator('[data-testid="timer-project-select"] option').all()
    if (options.length <= 1) {
      test.skip()
      return
    }
    await page.selectOption('[data-testid="timer-project-select"]', { index: 1 })
    await page.click('[data-testid="timer-submit-btn"]')
    await expect(page.locator('[data-testid="active-timer"]')).toBeVisible({ timeout: 5000 })
  })

  test('parar timer remove o cronômetro', async ({ memberPage: page }) => {
    await page.goto('/app/dashboard')
    const activeTimer = page.locator('[data-testid="active-timer"]')
    const isActive = await activeTimer.isVisible()
    if (!isActive) {
      test.skip()
      return
    }
    await page.click('[data-testid="stop-timer-btn"]')
    await expect(activeTimer).not.toBeVisible({ timeout: 5000 })
  })

  test('botão de iniciar timer visível quando sem timer ativo', async ({ memberPage: page }) => {
    await page.goto('/app/dashboard')
    const activeTimer = page.locator('[data-testid="active-timer"]')
    const startBtn = page.locator('[data-testid="start-timer-btn"]')
    const hasActive = await activeTimer.isVisible()
    if (!hasActive) {
      await expect(startBtn).toBeVisible()
    }
  })

  test('segundo timer bloqueado — botão iniciar oculto quando timer ativo', async ({ memberPage: page }) => {
    await page.goto('/app/dashboard')
    await page.waitForLoadState('networkidle')
    const activeTimer = page.locator('[data-testid="active-timer"]')
    const startBtn = page.locator('[data-testid="start-timer-btn"]')

    // If no active timer, try to start one first
    if (!await activeTimer.isVisible()) {
      const btnVisible = await startBtn.isVisible()
      if (!btnVisible) { test.skip(); return }
      await startBtn.click()
      const select = page.locator('[data-testid="timer-project-select"]')
      await page.waitForSelector('[data-testid="timer-project-select"]')
      const projectOptions = await select.locator('option').all()
      if (projectOptions.length <= 1) { test.skip(); return }
      await select.selectOption({ index: 1 })
      // Wait for task select to appear
      await page.waitForTimeout(600)
      const taskSelect = page.locator('select').filter({ hasNot: page.locator('[data-testid="timer-project-select"]') }).last()
      const taskOptions = await taskSelect.locator('option').all()
      if (taskOptions.length <= 1) { test.skip(); return }
      await taskSelect.selectOption({ index: 1 })
      await page.click('[data-testid="timer-submit-btn"]')
      await expect(activeTimer).toBeVisible({ timeout: 6000 })
    }

    // With active timer running: start-timer-btn must NOT be visible (UI blocks second timer)
    await expect(activeTimer).toBeVisible()
    await expect(startBtn).not.toBeVisible()
  })
})
