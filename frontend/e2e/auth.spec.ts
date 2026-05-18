import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('cadastro com sucesso exibe mensagem de verificação', async ({ page }) => {
    await page.goto('/register')
    await page.fill('[name="name"]', 'Usuário Teste')
    await page.fill('[name="email"]', `test_${Date.now()}@example.com`)
    await page.fill('[name="password"]', 'senha1234')
    await page.fill('[name="confirmPassword"]', 'senha1234')
    await page.click('[type="submit"]')
    await expect(page.locator('text=Verifique seu e-mail')).toBeVisible({ timeout: 5000 })
  })

  test('cadastro com e-mail duplicado exibe erro', async ({ page }) => {
    await page.goto('/register')
    await page.fill('[name="name"]', 'Admin')
    await page.fill('[name="email"]', process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com')
    await page.fill('[name="password"]', 'senha1234')
    await page.fill('[name="confirmPassword"]', 'senha1234')
    await page.click('[type="submit"]')
    await expect(page.locator('text=já cadastrado')).toBeVisible({ timeout: 5000 })
  })

  test('login com credenciais inválidas exibe mensagem', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('[type="submit"]')
    await expect(page.locator('text=inválid')).toBeVisible({ timeout: 5000 })
  })

  test('login com sucesso redireciona para dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com')
    await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD ?? 'admin1234')
    await page.click('[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
  })

  test('acesso sem token redireciona para login', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('recuperação de senha exibe mensagem genérica', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.fill('[name="email"]', 'qualquer@example.com')
    await page.click('[type="submit"]')
    await expect(page.locator('text=link foi enviado')).toBeVisible({ timeout: 5000 })
  })
})
