<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <!-- Overlay for mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg flex flex-col transition-transform duration-200',
        'lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex items-center h-16 px-6 border-b border-gray-200">
        <span class="text-xl font-bold text-blue-600">TimeTracker</span>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to" :data-testid="`sidebar-${link.to.split('/').pop()}-link`" class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-600">
          <span class="text-base">{{ link.icon }}</span>
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-gray-200 p-4">
        <RouterLink to="/app/profile" class="flex items-center gap-3 hover:bg-gray-50 rounded-md p-2 transition-colors">
          <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" class="w-8 h-8 rounded-full object-cover" alt="avatar" />
          <div v-else class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {{ authStore.user?.name?.charAt(0)?.toUpperCase() ?? '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
          </div>
        </RouterLink>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
        <button class="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors" @click="sidebarOpen = !sidebarOpen">
          ☰
        </button>
        <h1 class="text-lg font-semibold text-gray-800 flex-1 truncate">{{ route.meta?.title as string ?? '' }}</h1>
        <div class="flex items-center gap-2">
          <ActiveTimer />
          <div class="relative">
            <button class="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors" @click="dropdownOpen = !dropdownOpen">
              <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" class="w-8 h-8 rounded-full object-cover" alt="avatar" />
              <div v-else class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {{ authStore.user?.name?.charAt(0)?.toUpperCase() ?? '?' }}
              </div>
            </button>
            <div v-if="dropdownOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
              <RouterLink to="/app/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" @click="dropdownOpen = false">Perfil</RouterLink>
              <button class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" @click="handleLogout">Sair</button>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ActiveTimer from '@/components/timer/ActiveTimer.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sidebarOpen = ref(false)
const dropdownOpen = ref(false)

const allLinks = [
  { to: '/app/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager', 'member'] },
  { to: '/app/projects', label: 'Projetos', icon: '📁', roles: ['admin', 'manager', 'member'] },
  { to: '/app/teams', label: 'Equipes', icon: '👥', roles: ['admin', 'manager'] },
  { to: '/app/time-entries', label: 'Lançamentos', icon: '⏱️', roles: ['admin', 'manager', 'member'] },
  { to: '/app/reports/daily', label: 'Relatórios', icon: '📈', roles: ['admin', 'manager', 'member'] },
  { to: '/app/reports/allocation', label: 'Alocação', icon: '🎯', roles: ['admin', 'manager'] },
  { to: '/app/settings', label: 'Configurações', icon: '⚙️', roles: ['admin'] },
]

const navLinks = computed(() =>
  allLinks.filter((l) => l.roles.includes(authStore.user?.role ?? '')),
)

async function handleLogout() {
  dropdownOpen.value = false
  authStore.logout()
  await router.push('/login')
}
</script>
