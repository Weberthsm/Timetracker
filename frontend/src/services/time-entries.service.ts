import api from './api'

export interface TimeEntry {
  id: string
  description: string | null
  startedAt: string | null
  endedAt: string | null
  duration: number | null
  durationOnly: boolean
  userId: string
  taskId: string | null
  projectId: string | null
  date: string
  createdAt: string
  task?: { id: string; title: string } | null
  project?: { id: string; name: string; color: string | null } | null
  user?: { id: string; name: string; email: string } | null
}

export interface CreateTimeEntryPayload {
  projectId: string
  taskId?: string
  description?: string
  date: string
  // Modo horário
  startedAt?: string
  endedAt?: string
  // Modo só duração
  durationOnly?: boolean
  durationSeconds?: number
}

export const timeEntriesService = {
  list: (params?: Record<string, string | number>) => api.get('/time-entries', { params }),
  get: (id: string) => api.get(`/time-entries/${id}`),
  create: (data: CreateTimeEntryPayload) => api.post('/time-entries', data),
  update: (id: string, data: Partial<CreateTimeEntryPayload>) => api.patch(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
  startTimer: (data: { projectId: string; taskId?: string; description?: string }) => api.post('/time-entries/start', data),
  stopTimer: (id: string) => api.patch(`/time-entries/${id}/stop`),
  activeTimer: () => api.get('/time-entries/active'),
}
