<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <h1 class="text-xl font-bold text-gray-900">Configurações do Sistema</h1>

    <div v-if="loading" class="text-sm text-gray-400">Carregando...</div>

    <form v-else data-testid="settings-form" class="bg-white rounded-xl border border-gray-200 p-6 space-y-6" @submit.prevent="save">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900">Verificação de e-mail obrigatória</p>
          <p class="text-xs text-gray-500 mt-0.5">Novos usuários devem confirmar o e-mail antes de fazer login</p>
        </div>
        <button
          type="button"
          data-testid="require-email-verification-toggle"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            form.requireEmailVerification ? 'bg-blue-600' : 'bg-gray-200',
          ]"
          @click="form.requireEmailVerification = !form.requireEmailVerification"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              form.requireEmailVerification ? 'translate-x-6' : 'translate-x-1',
            ]"
          />
        </button>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

      <div class="flex justify-end">
        <BaseButton type="submit" :loading="saving">Salvar</BaseButton>
      </div>
    </form>

    <!-- Webhooks -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-semibold text-gray-900">Webhooks</h2>
          <p class="text-xs text-gray-500 mt-0.5">Receba notificações HTTP quando eventos ocorrerem</p>
        </div>
        <BaseButton
          v-if="!showWebhookForm"
          data-testid="new-webhook-btn"
          variant="secondary"
          size="sm"
          @click="showWebhookForm = true"
        >
          + Novo Webhook
        </BaseButton>
      </div>

      <!-- New webhook form -->
      <form v-if="showWebhookForm" class="mb-4 p-4 bg-gray-50 rounded-lg space-y-3" @submit.prevent="createWebhook">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Nome</label>
          <input
            v-model="webhookForm.name"
            data-testid="webhook-name"
            type="text"
            placeholder="Ex.: Slack notificações"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">URL</label>
          <input
            v-model="webhookForm.url"
            data-testid="webhook-url"
            type="url"
            placeholder="https://..."
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Eventos <span class="text-red-500">*</span></label>
          <div class="grid grid-cols-2 gap-1.5 mt-1">
            <label
              v-for="ev in WEBHOOK_EVENTS"
              :key="ev.value"
              class="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none"
            >
              <input
                v-model="webhookForm.events"
                type="checkbox"
                :value="ev.value"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {{ ev.label }}
            </label>
          </div>
          <p v-if="webhookForm.events.length === 0 && webhookSubmitAttempted" class="text-xs text-red-500 mt-1">
            Selecione ao menos um evento.
          </p>
        </div>
        <p v-if="webhookError" class="text-xs text-red-600">{{ webhookError }}</p>
        <div class="flex gap-2 justify-end">
          <BaseButton variant="ghost" size="sm" type="button" @click="cancelWebhookForm">Cancelar</BaseButton>
          <BaseButton data-testid="webhook-submit" size="sm" :loading="savingWebhook" type="submit">Criar</BaseButton>
        </div>
      </form>

      <!-- Webhooks list -->
      <div v-if="webhooks.length === 0 && !showWebhookForm" class="text-sm text-gray-400 py-2">
        Nenhum webhook configurado
      </div>
      <ul v-else-if="webhooks.length > 0" data-testid="webhooks-list" class="divide-y divide-gray-100">
        <li v-for="wh in webhooks" :key="wh.id" class="py-3">
          <!-- Header row -->
          <div class="flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-medium text-gray-800">{{ wh.name }}</p>
                <span
                  :class="wh.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="text-[10px] font-medium px-1.5 py-0.5 rounded"
                >{{ wh.isActive ? 'Ativo' : 'Inativo' }}</span>
              </div>
              <p class="text-xs text-gray-400 truncate max-w-xs mt-0.5">{{ wh.url }}</p>
              <!-- Event badges -->
              <div class="flex flex-wrap gap-1 mt-1.5">
                <span
                  v-for="ev in wh.events"
                  :key="ev"
                  class="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium"
                >{{ ev }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0 mt-0.5">
              <button
                class="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                :disabled="testingWebhookId === wh.id"
                @click="testWebhook(wh.id)"
              >
                {{ testingWebhookId === wh.id ? 'Testando…' : 'Testar' }}
              </button>
              <button
                class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                @click="toggleDeliveries(wh.id)"
              >
                {{ expandedDeliveries === wh.id ? 'Ocultar logs' : 'Ver logs' }}
              </button>
              <button
                class="text-xs text-red-500 hover:text-red-700 transition-colors"
                @click="removeWebhook(wh.id)"
              >
                Remover
              </button>
            </div>
          </div>

          <!-- Inline test result -->
          <div
            v-if="testResults[wh.id]"
            :class="testResults[wh.id]!.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'"
            class="mt-2 text-xs px-3 py-2 rounded-md border flex items-center gap-2"
          >
            <span>{{ testResults[wh.id]!.success ? '✓' : '✗' }}</span>
            <span v-if="testResults[wh.id]!.statusCode">HTTP {{ testResults[wh.id]!.statusCode }}</span>
            <span>{{ testResults[wh.id]!.success ? 'Entrega bem-sucedida' : 'Falha na entrega — verifique a URL e os logs abaixo' }}</span>
          </div>

          <!-- Deliveries panel -->
          <div v-if="expandedDeliveries === wh.id" class="mt-3 border border-gray-100 rounded-lg overflow-hidden">
            <div class="bg-gray-50 px-3 py-2 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-700">Histórico de entregas</span>
              <button class="text-xs text-blue-600 hover:underline" @click="loadDeliveries(wh.id)">↻ Atualizar</button>
            </div>
            <div v-if="loadingDeliveries" class="px-3 py-4 text-xs text-gray-400 text-center">Carregando...</div>
            <div v-else-if="deliveries.length === 0" class="px-3 py-4 text-xs text-gray-400 text-center">Nenhuma entrega registrada</div>
            <table v-else class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left px-3 py-2 font-medium text-gray-500 w-8">#</th>
                  <th class="text-left px-3 py-2 font-medium text-gray-500">Evento</th>
                  <th class="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                  <th class="text-left px-3 py-2 font-medium text-gray-500">Data</th>
                  <th class="text-left px-3 py-2 font-medium text-gray-500 hidden sm:table-cell">Resposta</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="d in deliveries" :key="d.id" class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-gray-400">{{ d.attempt }}</td>
                  <td class="px-3 py-2 font-mono text-gray-700">{{ d.event }}</td>
                  <td class="px-3 py-2">
                    <span
                      :class="d.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                      class="px-1.5 py-0.5 rounded font-medium"
                    >{{ d.statusCode ?? 'timeout' }}</span>
                  </td>
                  <td class="px-3 py-2 text-gray-400 whitespace-nowrap">{{ formatDate(d.deliveredAt) }}</td>
                  <td class="px-3 py-2 text-gray-400 hidden sm:table-cell truncate max-w-xs">{{ d.responseBody ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import { settingsService } from '@/services/settings.service'
import { webhooksService, type Webhook, type WebhookDelivery } from '@/services/webhooks.service'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/ui/BaseButton.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const form = ref({ requireEmailVerification: true })

// ── Webhooks ──────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  { value: 'time_entry.created', label: 'Lançamento criado' },
  { value: 'time_entry.updated', label: 'Lançamento atualizado' },
  { value: 'time_entry.deleted', label: 'Lançamento removido' },
  { value: 'timer.started',      label: 'Timer iniciado' },
  { value: 'timer.stopped',      label: 'Timer parado' },
  { value: 'report.daily',       label: 'Relatório diário' },
  { value: 'report.monthly',     label: 'Relatório mensal' },
]

const webhooks = ref<Webhook[]>([])
const showWebhookForm = ref(false)
const savingWebhook = ref(false)
const webhookError = ref('')
const webhookSubmitAttempted = ref(false)
const webhookForm = ref<{ name: string; url: string; events: string[] }>({ name: '', url: '', events: [] })

// Test
const testingWebhookId = ref<string | null>(null)
const testResults = ref<Record<string, { success: boolean; statusCode: number | null } | undefined>>({})

// Deliveries
const expandedDeliveries = ref<string | null>(null)
const deliveries = ref<WebhookDelivery[]>([])
const loadingDeliveries = ref(false)

// ── Settings save ─────────────────────────────────────────────────────────

async function save() {
  saving.value = true
  errorMsg.value = ''
  try {
    await settingsService.update(form.value)
    toast.success('Configurações atualizadas com sucesso')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMsg.value = e.response?.data?.message ?? 'Erro ao salvar.'
  } finally {
    saving.value = false
  }
}

// ── Webhook CRUD ──────────────────────────────────────────────────────────

async function loadWebhooks() {
  try {
    const res = await webhooksService.list()
    webhooks.value = (res.data as { data: Webhook[] }).data
  } catch {
    // non-critical
  }
}

async function createWebhook() {
  webhookSubmitAttempted.value = true
  if (webhookForm.value.events.length === 0) return
  savingWebhook.value = true
  webhookError.value = ''
  try {
    const res = await webhooksService.create({
      name: webhookForm.value.name,
      url: webhookForm.value.url,
      events: webhookForm.value.events,
    })
    const created = (res.data as { data: Webhook }).data
    webhooks.value.unshift(created)
    webhookForm.value = { name: '', url: '', events: [] }
    webhookSubmitAttempted.value = false
    showWebhookForm.value = false
    toast.success('Webhook criado com sucesso')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    webhookError.value = e.response?.data?.message ?? 'Erro ao criar webhook.'
  } finally {
    savingWebhook.value = false
  }
}

async function removeWebhook(id: string) {
  try {
    await webhooksService.remove(id)
    webhooks.value = webhooks.value.filter((w) => w.id !== id)
    if (expandedDeliveries.value === id) expandedDeliveries.value = null
    delete testResults.value[id]
    toast.success('Webhook removido')
  } catch {
    toast.error('Erro ao remover webhook')
  }
}

function cancelWebhookForm() {
  showWebhookForm.value = false
  webhookForm.value = { name: '', url: '', events: [] }
  webhookError.value = ''
  webhookSubmitAttempted.value = false
}

// ── Test ──────────────────────────────────────────────────────────────────

async function testWebhook(id: string) {
  if (testingWebhookId.value) return
  testingWebhookId.value = id
  testResults.value[id] = undefined
  try {
    const res = await webhooksService.test(id)
    const delivery = (res.data as { data: { statusCode: number | null; success: boolean } }).data
    testResults.value = {
      ...testResults.value,
      [id]: { success: delivery.success, statusCode: delivery.statusCode },
    }
    if (delivery.success) {
      toast.success('Webhook respondeu com sucesso!')
    } else {
      toast.error(`Webhook falhou — HTTP ${delivery.statusCode ?? 'timeout'}`)
    }
  } catch {
    testResults.value = { ...testResults.value, [id]: { success: false, statusCode: null } }
    toast.error('Não foi possível alcançar a URL do webhook')
  } finally {
    testingWebhookId.value = null
    // Refresh deliveries if panel is open
    if (expandedDeliveries.value === id) await loadDeliveries(id)
  }
}

// ── Deliveries ────────────────────────────────────────────────────────────

async function toggleDeliveries(id: string) {
  if (expandedDeliveries.value === id) {
    expandedDeliveries.value = null
    deliveries.value = []
    return
  }
  expandedDeliveries.value = id
  await loadDeliveries(id)
}

async function loadDeliveries(id: string) {
  loadingDeliveries.value = true
  try {
    const res = await webhooksService.deliveries(id, { limit: 20 })
    const body = res.data as { data: { data: WebhookDelivery[] } }
    deliveries.value = body.data.data
  } catch {
    deliveries.value = []
  } finally {
    loadingDeliveries.value = false
  }
}

function formatDate(iso: string) {
  try {
    return format(parseISO(iso), 'dd/MM/yy HH:mm:ss')
  } catch {
    return iso
  }
}

// ── Init ──────────────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true
  try {
    const res = await settingsService.get()
    const data = (res.data as { data: { requireEmailVerification: boolean } }).data
    form.value.requireEmailVerification = data.requireEmailVerification
  } finally {
    loading.value = false
  }
  await loadWebhooks()
})
</script>
