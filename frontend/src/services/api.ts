import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

export type ToastFn = (message: string, type?: 'error' | 'warning' | 'info') => void
let showToast: ToastFn = () => {}
let navigateToLogin: () => void = () => {}
let onTokensRefreshed: ((accessToken: string, refreshToken: string) => void) | null = null

export function configureApi(toast: ToastFn, loginNav: () => void) {
  showToast = toast
  navigateToLogin = loginNav
}

export function setOnTokensRefreshed(fn: (accessToken: string, refreshToken: string) => void) {
  onTokensRefreshed = fn
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  failedQueue = []
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; details?: unknown }>) => {
    const originalRequest = error.config as RetryConfig | undefined

    if (!error.response) {
      showToast('Sem conexão com o servidor.', 'error')
      return Promise.reject(error)
    }

    const { status, data } = error.response

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('auth_token')
        navigateToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/auth/refresh`,
          { refreshToken },
        )
        const body = (res.data as { data: { accessToken: string; refreshToken: string } }).data
        const newToken = body.accessToken
        const newRefreshToken = body.refreshToken

        localStorage.setItem('auth_token', newToken)
        // Always persist the rotated refresh token returned by the server
        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken)
        // Sync Pinia store so authStore.token nunca fica stale em memória
        if (onTokensRefreshed) onTokensRefreshed(newToken, newRefreshToken)

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        navigateToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (status === 403) {
      showToast('Acesso não permitido', 'error')
    } else if (status === 422) {
      return Promise.reject({ ...error, validationDetails: data?.details })
    } else if (status === 429) {
      showToast('Muitas tentativas. Aguarde antes de tentar novamente.', 'warning')
    } else if (status >= 400 && status < 500) {
      showToast(data?.message ?? 'Erro na requisição.', 'error')
    } else if (status >= 500) {
      showToast('Erro interno. Tente novamente.', 'error')
    }

    return Promise.reject(error)
  },
)

export default api
