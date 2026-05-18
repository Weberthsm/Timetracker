import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockPush = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}))

import { authService } from '@/services/auth.service'
import { useAuth } from './useAuth'

const mockUser = { id: '1', name: 'Admin', email: 'a@b.com', role: 'admin' as const }

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('login: redireciona para dashboard após sucesso', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      data: { data: { accessToken: 'tok', user: mockUser } },
    } as never)
    vi.mocked(authService.me).mockResolvedValue({
      data: { data: mockUser },
    } as never)

    const { login } = useAuth()
    await login({ email: 'a@b.com', password: 'pass' })

    expect(mockPush).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  it('logout: limpa store e redireciona para login', async () => {
    const { logout } = useAuth()
    await logout()

    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(mockPush).toHaveBeenCalledWith({ name: 'login' })
  })
})
