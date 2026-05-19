<template>
  <BaseModal :open="open" :title="entry ? 'Editar Lançamento' : 'Novo Lançamento'" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Projeto <span class="text-red-500">*</span></label>
        <select v-model="form.projectId" data-testid="entry-project" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="" disabled>Selecione...</option>
          <option v-for="p in activeProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div v-if="projectTasks.length">
        <label class="block text-sm font-medium text-gray-700 mb-1">Tarefa</label>
        <select v-model="form.taskId" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Sem tarefa</option>
          <option v-for="t in projectTasks" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Data <span class="text-red-500">*</span></label>
        <input v-model="form.date" type="date" :max="today" data-testid="entry-date" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p v-if="isPastDate" data-testid="retro-warning" class="mt-1 text-xs text-yellow-600">Você está registrando horas em uma data anterior a hoje</p>
      </div>

      <!-- ── Input mode toggle ──────────────────────────────────────────── -->
      <div v-if="availableModes.length > 1" class="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
        <button
          v-for="m in availableModes"
          :key="m.value"
          type="button"
          :class="inputMode === m.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          class="flex-1 px-3 py-1.5 font-medium transition-colors"
          @click="switchMode(m.value)"
        >{{ m.label }}</button>
      </div>

      <!-- ── Modo: Início / Fim ─────────────────────────────────────────── -->
      <template v-if="inputMode === 'times'">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Início <span class="text-red-500">*</span></label>
            <input v-model="form.startTime" type="time" data-testid="entry-start" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fim <span class="text-red-500">*</span></label>
            <input v-model="form.endTime" type="time" data-testid="entry-end" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p v-if="timeError" class="mt-1 text-xs text-red-600">{{ timeError }}</p>
          </div>
        </div>
        <p v-if="durationPreview" class="text-xs text-gray-600">Duração: <strong>{{ durationPreview }}</strong></p>
      </template>

      <!-- ── Modo: Início + Duração ─────────────────────────────────────── -->
      <template v-else-if="inputMode === 'start-duration'">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Início <span class="text-red-500">*</span></label>
          <input v-model="form.startTime" type="time" data-testid="entry-start" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Horas <span class="text-red-500">*</span></label>
            <input v-model.number="durationH" type="number" min="0" max="23" data-testid="entry-duration-h" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Minutos <span class="text-red-500">*</span></label>
            <input v-model.number="durationM" type="number" min="0" max="59" step="5" data-testid="entry-duration-m" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <p v-if="computedEndTime" class="text-xs text-gray-600">
          Término calculado: <strong>{{ computedEndTime }}</strong>
          <span class="text-gray-400"> · duração: {{ durationLabel }}</span>
        </p>
        <p v-if="durationError" class="text-xs text-red-600">{{ durationError }}</p>
      </template>

      <!-- ── Modo: Apenas Duração ───────────────────────────────────────── -->
      <template v-else>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Horas <span class="text-red-500">*</span></label>
            <input v-model.number="durationH" type="number" min="0" max="99" data-testid="entry-duration-h" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Minutos <span class="text-red-500">*</span></label>
            <input v-model.number="durationM" type="number" min="0" max="59" step="5" data-testid="entry-duration-m" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <p v-if="durationLabel" class="text-xs text-gray-600">Duração: <strong>{{ durationLabel }}</strong></p>
        <p v-if="durationError" class="text-xs text-red-600">{{ durationError }}</p>
      </template>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea v-model="form.description" rows="2" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton data-testid="entry-submit" :loading="loading" :disabled="!isValid" @click="submit">{{ entry ? 'Salvar' : 'Adicionar' }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useSettingsStore, type EntryInputMode } from '@/stores/settings'
import { timeEntriesService, type TimeEntry } from '@/services/time-entries.service'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ open: boolean; entry?: TimeEntry | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const settingsStore = useSettingsStore()
const loading = ref(false)
const errorMsg = ref('')
const today = format(new Date(), 'yyyy-MM-dd')

// ── Input mode ────────────────────────────────────────────────────────────

const MODE_LABELS: Record<EntryInputMode, string> = {
  'times':           'Início / Fim',
  'start-duration':  'Início + Duração',
  'duration-only':   'Só Duração',
}

const availableModes = computed(() =>
  settingsStore.availableModes.map((v) => ({ value: v, label: MODE_LABELS[v] })),
)

const LAST_MODE_KEY = 'timetracker:lastEntryMode'

function savedMode(): EntryInputMode | null {
  const v = localStorage.getItem(LAST_MODE_KEY) as EntryInputMode | null
  return v && settingsStore.availableModes.includes(v) ? v : null
}

const inputMode = ref<EntryInputMode>(savedMode() ?? settingsStore.availableModes[0] ?? 'times')

// ── Form state ────────────────────────────────────────────────────────────

const form = ref({ projectId: '', taskId: '', date: today, startTime: '', endTime: '', description: '' })
const durationH = ref(0)
const durationM = ref(0)

// ── Derived ───────────────────────────────────────────────────────────────

const activeProjects = computed(() => projectsStore.projects.filter((p) => p.status === 'active'))

const projectTasks = computed(() =>
  (tasksStore.tasksByProject[form.value.projectId] ?? [])
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled'),
)

const isPastDate = computed(() => form.value.date < today && form.value.date !== '')

const totalDurationSeconds = computed(() => durationH.value * 3600 + durationM.value * 60)

const durationLabel = computed(() => {
  const secs = totalDurationSeconds.value
  if (secs <= 0) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
})

/** Computed end time for start-duration mode */
const computedEndTime = computed(() => {
  if (inputMode.value !== 'start-duration') return ''
  if (!form.value.startTime || totalDurationSeconds.value <= 0) return ''
  const [sh, sm] = form.value.startTime.split(':').map(Number)
  const totalMin = sh * 60 + sm + Math.floor(totalDurationSeconds.value / 60)
  const eh = Math.floor(totalMin / 60) % 24
  const em = totalMin % 60
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
})

const timeError = computed(() => {
  if (inputMode.value !== 'times') return ''
  if (!form.value.startTime || !form.value.endTime) return ''
  return form.value.endTime <= form.value.startTime ? 'Fim deve ser após início' : ''
})

const durationError = computed(() => {
  if (inputMode.value === 'times') return ''
  if (totalDurationSeconds.value < 60) return 'Informe ao menos 1 minuto'
  return ''
})

const durationPreview = computed(() => {
  if (inputMode.value !== 'times' || !form.value.startTime || !form.value.endTime || timeError.value) return ''
  const [sh, sm] = form.value.startTime.split(':').map(Number)
  const [eh, em] = form.value.endTime.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
})

const isValid = computed(() => {
  if (!form.value.projectId || !form.value.date) return false
  if (inputMode.value === 'times') {
    return !!form.value.startTime && !!form.value.endTime && !timeError.value
  }
  if (inputMode.value === 'start-duration') {
    return !!form.value.startTime && totalDurationSeconds.value >= 60
  }
  // duration-only
  return totalDurationSeconds.value >= 60
})

// ── Mode switch ───────────────────────────────────────────────────────────

function switchMode(mode: EntryInputMode) {
  if (mode === inputMode.value) return

  // Preserve data when switching between modes
  if (inputMode.value === 'times' && form.value.startTime && form.value.endTime && !timeError.value) {
    const [sh, sm] = form.value.startTime.split(':').map(Number)
    const [eh, em] = form.value.endTime.split(':').map(Number)
    const totalMin = (eh * 60 + em) - (sh * 60 + sm)
    if (totalMin > 0) {
      durationH.value = Math.floor(totalMin / 60)
      durationM.value = totalMin % 60
    }
  }
  if (inputMode.value === 'start-duration' && mode === 'times' && computedEndTime.value) {
    form.value.endTime = computedEndTime.value
  }
  if (mode === 'duration-only') {
    form.value.startTime = ''
    form.value.endTime = ''
  }

  inputMode.value = mode
}

// ── Watchers ──────────────────────────────────────────────────────────────

watch(() => form.value.projectId, async (id) => {
  form.value.taskId = ''
  if (id && !tasksStore.tasksByProject[id]) await tasksStore.fetchByProject(id)
})

watch(() => props.open, (open) => {
  if (!open) return
  const e = props.entry

  // Pick best default mode:
  // • Editing → match the entry type (durationOnly → duration-only, otherwise first available)
  // • New → last mode the user used (if still available), otherwise first available
  const modes = settingsStore.availableModes
  if (e?.durationOnly && modes.includes('duration-only')) {
    inputMode.value = 'duration-only'
  } else if (e) {
    inputMode.value = modes[0] ?? 'times'
  } else {
    inputMode.value = savedMode() ?? modes[0] ?? 'times'
  }

  form.value = {
    projectId:   e?.projectId ?? '',
    taskId:      e?.taskId ?? '',
    date:        e ? format(new Date(e.startedAt ?? e.createdAt), 'yyyy-MM-dd') : today,
    startTime:   e?.startedAt ? format(new Date(e.startedAt), 'HH:mm') : '',
    endTime:     e?.endedAt   ? format(new Date(e.endedAt), 'HH:mm')   : '',
    description: e?.description ?? '',
  }

  if (e?.durationOnly && e.duration) {
    durationH.value = Math.floor(e.duration / 3600)
    durationM.value = Math.floor((e.duration % 3600) / 60)
  } else if (e?.startedAt && e?.endedAt) {
    // Pre-fill duration fields for start-duration mode
    const start = new Date(e.startedAt)
    const end   = new Date(e.endedAt)
    const totalMin = Math.floor((end.getTime() - start.getTime()) / 60000)
    durationH.value = Math.floor(totalMin / 60)
    durationM.value = totalMin % 60
  } else {
    durationH.value = 0
    durationM.value = 0
  }

  errorMsg.value = ''
})

// Re-evaluate default mode if settings load after the modal is already mounted
watch(() => settingsStore.availableModes, (modes) => {
  if (!modes.includes(inputMode.value)) {
    inputMode.value = modes[0] ?? 'times'
  }
})

// ── Submit ────────────────────────────────────────────────────────────────

async function submit() {
  if (!isValid.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    let payload: Record<string, unknown>

    if (inputMode.value === 'duration-only') {
      payload = {
        projectId:       form.value.projectId,
        taskId:          form.value.taskId || undefined,
        description:     form.value.description || undefined,
        date:            form.value.date,
        durationOnly:    true,
        durationSeconds: totalDurationSeconds.value,
      }
    } else {
      const endTime = inputMode.value === 'start-duration' ? computedEndTime.value : form.value.endTime
      payload = {
        projectId:   form.value.projectId,
        taskId:      form.value.taskId || undefined,
        description: form.value.description || undefined,
        date:        form.value.date,
        startedAt:   new Date(`${form.value.date}T${form.value.startTime}:00`).toISOString(),
        endedAt:     new Date(`${form.value.date}T${endTime}:00`).toISOString(),
      }
    }

    if (props.entry) {
      await timeEntriesService.update(props.entry.id, payload as Parameters<typeof timeEntriesService.update>[1])
    } else {
      await timeEntriesService.create(payload as Parameters<typeof timeEntriesService.create>[0])
      // Remember the mode for the next new entry
      localStorage.setItem(LAST_MODE_KEY, inputMode.value)
    }
    emit('saved')
    emit('close')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMsg.value = e.response?.data?.message ?? 'Erro ao salvar.'
  } finally {
    loading.value = false
  }
}
</script>
