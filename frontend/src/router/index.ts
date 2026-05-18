import { createRouter, createWebHistory } from 'vue-router'
import type { Role } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Role[]
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AuthLayout,
      children: [
        { path: '', redirect: '/login' },
        { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
        { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue') },
        { path: 'register-success', name: 'register-success', component: () => import('@/views/auth/RegisterSuccessView.vue') },
        { path: 'verify-email', name: 'verify-email', component: () => import('@/views/auth/VerifyEmailView.vue') },
        { path: 'forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue') },
        { path: 'reset-password', name: 'reset-password', component: () => import('@/views/auth/ResetPasswordView.vue') },
      ],
    },
    {
      path: '/app',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue'), meta: { title: 'Dashboard' } },
        { path: 'projects', name: 'projects', component: () => import('@/views/projects/ProjectsView.vue'), meta: { title: 'Projetos' } },
        { path: 'projects/:id', name: 'project-detail', component: () => import('@/views/projects/ProjectDetailView.vue'), meta: { title: 'Projeto' } },
        { path: 'teams', name: 'teams', component: () => import('@/views/teams/TeamsView.vue'), meta: { title: 'Equipes', roles: ['admin', 'manager'] as Role[] } },
        { path: 'teams/:id', name: 'team-detail', component: () => import('@/views/teams/TeamDetailView.vue'), meta: { title: 'Equipe', roles: ['admin', 'manager'] as Role[] } },
        { path: 'time-entries', name: 'time-entries', component: () => import('@/views/time-entries/TimeEntriesView.vue'), meta: { title: 'Lançamentos' } },
        { path: 'reports/daily', name: 'reports-daily', component: () => import('@/views/reports/DailyReportView.vue'), meta: { title: 'Relatório Diário' } },
        { path: 'reports/monthly', name: 'reports-monthly', component: () => import('@/views/reports/MonthlyReportView.vue'), meta: { title: 'Relatório Mensal' } },
        { path: 'reports/team', name: 'reports-team', component: () => import('@/views/reports/TeamReportView.vue'), meta: { title: 'Relatório de Equipe', roles: ['admin', 'manager'] as Role[] } },
        { path: 'reports/allocation', name: 'reports-allocation', component: () => import('@/views/reports/AllocationReportView.vue'), meta: { title: 'Alocação por Projeto', roles: ['admin', 'manager'] as Role[] } },
        { path: 'settings', name: 'settings', component: () => import('@/views/dashboard/SettingsView.vue'), meta: { title: 'Configurações', roles: ['admin'] as Role[] } },
        { path: 'profile', name: 'profile', component: () => import('@/views/dashboard/ProfileView.vue'), meta: { title: 'Perfil' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (!to.meta.requiresAuth && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role as Role)) {
    return { name: 'dashboard' }
  }

  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchCurrentUser()
    } catch {
      authStore.logout()
      return { name: 'login' }
    }
  }
})

export default router
