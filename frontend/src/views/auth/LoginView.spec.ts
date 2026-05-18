import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LoginView from './LoginView.vue'

const mockPush = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: {}, meta: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    resendVerification: vi.fn(),
  },
}))

import { authService } from '@/services/auth.service'

type FormVM = {
  setValues: (v: Record<string, string>) => void
  onSubmit: (e: Event) => Promise<void>
}

function createWrapper() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(LoginView, {
    attachTo: document.body,
    global: {
      plugins: [pinia],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

async function submitWithValues(wrapper: ReturnType<typeof mount>, email: string, password: string) {
  const vm = wrapper.vm as unknown as FormVM
  vm.setValues({ email, password })
  await flushPromises()
  await vm.onSubmit(new Event('submit', { cancelable: true }))
  await flushPromises()
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submeter campos vazios não chama a API', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as FormVM
    await vm.onSubmit(new Event('submit', { cancelable: true }))
    await flushPromises()
    expect(authService.login).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('sucesso chama router.push para dashboard', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      data: { data: { accessToken: 'tok', user: { id: '1', name: 'Admin', email: 'a@b.com', role: 'admin' } } },
    } as never)
    const wrapper = createWrapper()
    await submitWithValues(wrapper, 'user@test.com', 'password123')
    expect(authService.login).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/app/dashboard')
    wrapper.unmount()
  })

  it('erro 401 não redireciona e exibe mensagem', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Credenciais inválidas' } },
    })
    const wrapper = createWrapper()
    await submitWithValues(wrapper, 'user@test.com', 'wrongpass')
    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Credenciais inválidas')
    wrapper.unmount()
  })
})
