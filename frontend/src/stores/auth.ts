import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'

export type Role = 'admin' | 'manager' | 'member'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string | null
  emailVerifiedAt?: string | null
}

interface LoginCredentials {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  function setRefreshToken(rt: string) {
    refreshToken.value = rt
    localStorage.setItem('refresh_token', rt)
  }

  function setAuth(newUser: User, newToken: string) {
    user.value = newUser
    setToken(newToken)
  }

  function setUser(newUser: User) {
    user.value = newUser
  }

  function logout() {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }

  async function fetchCurrentUser() {
    try {
      const res = await authService.me()
      user.value = (res.data as { data: User }).data
    } catch (err: unknown) {
      const e = err as { response?: { status: number } }
      if (e.response?.status === 401) {
        logout()
      }
      throw err
    }
  }

  async function login(credentials: LoginCredentials) {
    const res = await authService.login(credentials)
    const { accessToken, refreshToken: rt } = (res.data as { data: { accessToken: string; refreshToken?: string; user: User } }).data
    setToken(accessToken)
    if (rt) setRefreshToken(rt)
    await fetchCurrentUser()
  }

  return { user, token, refreshToken, isAuthenticated, setToken, setRefreshToken, setAuth, setUser, logout, fetchCurrentUser, login }
})
