import { test as base, type Page } from '@playwright/test'
import axios from 'axios'

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

async function loginViaApi(page: Page, email: string, password: string) {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password })
  const { accessToken, refreshToken } = res.data.data as { accessToken: string; refreshToken: string }
  await page.addInitScript(
    ({ token, rt }: { token: string; rt: string }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('refresh_token', rt)
    },
    { token: accessToken, rt: refreshToken },
  )
}

type AuthFixtures = {
  adminPage: Page
  memberPage: Page
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginViaApi(
      page,
      process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com',
      process.env.TEST_ADMIN_PASSWORD ?? 'admin1234',
    )
    await use(page)
    await context.close()
  },

  memberPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginViaApi(
      page,
      process.env.TEST_MEMBER_EMAIL ?? 'member@test.com',
      process.env.TEST_MEMBER_PASSWORD ?? 'member1234',
    )
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
