import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('success: emite evento com tipo success', () => {
    const { success, toasts } = useToast()
    success('Operação concluída')
    expect(toasts.value[0]).toMatchObject({ message: 'Operação concluída', type: 'success' })
  })

  it('error: emite evento com tipo error', () => {
    const { error, toasts } = useToast()
    error('Algo deu errado')
    expect(toasts.value[0]).toMatchObject({ message: 'Algo deu errado', type: 'error' })
  })

  it('toast é removido após o duration', () => {
    const { show, toasts } = useToast()
    show('msg', 'info', 2000)
    expect(toasts.value.length).toBe(1)
    vi.advanceTimersByTime(2001)
    expect(toasts.value.filter((t) => t.message === 'msg').length).toBe(0)
  })
})
