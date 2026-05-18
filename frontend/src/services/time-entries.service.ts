import api from './api'

export interface TimeEntry {
  id: string
  description: string | null
  startedAt: string
  endedAt: string | null
  duration: number | null
  userId: string
  taskId: string | null
  projectId: string | null
  task?: { id: string; title: string } | null
  project?: { id: string; name: string; color: string } | null
}

export const timeEntriesService = {
  list: (params?: Record<string, string>) => api.get('/time-entries', { params }),
  get: (id: string) => api.get(`/time-entries/${id}`),
  create: (data: { description?: string; taskId?: string; projectId?: string }) =>
    api.post('/time-entries', data),
  update: (id: string, data: Partial<TimeEntry>) => api.patch(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
  startTimer: (data: { projectId: string; taskId?: string; description?: string }) => api.post('/time-entries/start', data),
  stopTimer: (id: string) => api.patch(`/time-entries/${id}/stop`),
  activeTimer: () => api.get('/time-entries/active'),
}
