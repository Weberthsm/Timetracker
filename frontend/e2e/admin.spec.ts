import { test, expect } from './fixtures/auth.fixture'

test.describe('Admin — Configurações', () => {
  test('admin acessa configurações', async ({ adminPage: page }) => {
    await page.goto('/app/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible()
  })

  test('admin pode alternar verificação de e-mail', async ({ adminPage: page }) => {
    await page.goto('/app/settings')
    await page.waitForLoadState('networkidle')
    const toggle = page.locator('[data-testid="require-email-verification-toggle"]')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await toggle.click()
  })

  test('member redirecionado ao tentar acessar settings', async ({ memberPage: page }) => {
    await page.goto('/app/settings')
    await expect(page).not.toHaveURL(/\/settings/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 5000 })
  })

  test('member não vê link de equipes na sidebar', async ({ memberPage: page }) => {
    await page.goto('/app/dashboard')
    await expect(page.locator('[data-testid="sidebar-teams-link"]')).not.toBeVisible()
  })

  test('admin vê link de configurações na sidebar', async ({ adminPage: page }) => {
    await page.goto('/app/dashboard')
    await expect(page.locator('[data-testid="sidebar-settings-link"]')).toBeVisible()
  })

  test('admin cria webhook e ele aparece na lista', async ({ adminPage: page }) => {
    await page.goto('/app/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible()

    await page.click('[data-testid="new-webhook-btn"]')
    await page.fill('[data-testid="webhook-name"]', 'Teste Webhook')
    await page.fill('[data-testid="webhook-url"]', 'https://webhook.site/test-e2e')
    await page.click('[data-testid="webhook-submit"]')

    await expect(page.locator('[data-testid="webhooks-list"]')).toContainText('Teste Webhook', { timeout: 6000 })
  })
})
