import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}))

import { authService } from '@/services/auth.service'

const mockUser = { id: '1', name: 'Admin', email: 'a@b.com', role: 'admin' as const }

function setup() {
  localStorage.clear()
  const pinia = createPinia()
  setActivePinia(pinia)
  return useAuthStore()
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('login: salva token no localStorage e chama fetchCurrentUser', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      data: { data: { accessToken: 'tok123', user: mockUser } },
    } as never)
    vi.mocked(authService.me).mockResolvedValue({
      data: { data: mockUser },
    } as never)

    const store = setup()
    await store.login({ email: 'a@b.com', password: 'pass' })

    expect(localStorage.getItem('auth_token')).toBe('tok123')
    expect(store.token).toBe('tok123')
    expect(store.user?.name).toBe('Admin')
  })

  it('login: user preenchido após fetchCurrentUser', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      data: { data: { accessToken: 'tok', user: mockUser } },
    } as never)
    vi.mocked(authService.me).mockResolvedValue({
      data: { data: { ...mockUser, name: 'Atualizado' } },
    } as never)

    const store = setup()
    await store.login({ email: 'a@b.com', password: 'pass' })

    expect(store.user?.name).toBe('Atualizado')
  })

  it('logout: limpa token e user do localStorage', () => {
    const store = setup()
    store.setAuth(mockUser, 'mytoken')
    expect(localStorage.getItem('auth_token')).toBe('mytoken')

    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('fetchCurrentUser: 401 chama logout', async () => {
    vi.mocked(authService.me).mockRejectedValueOnce({ response: { status: 401 } })

    const store = setup()
    store.setAuth(mockUser, 'tok')

    await expect(store.fetchCurrentUser()).rejects.toBeDefined()
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
  })
})
