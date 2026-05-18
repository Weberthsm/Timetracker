import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

interface LoginCredentials {
  email: string
  password: string
}

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  async function login(credentials: LoginCredentials) {
    await authStore.login(credentials)
    await router.push({ name: 'dashboard' })
  }

  async function logout() {
    authStore.logout()
    await router.push({ name: 'login' })
  }

  return {
    login,
    logout,
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
  }
}
