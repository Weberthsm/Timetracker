import api from './api'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  projectId: string
  createdAt: string
  timeEntriesCount?: number
}

export const tasksService = {
  list: (projectId: string, params?: Record<string, string>) =>
    api.get(`/projects/${projectId}/tasks`, { params }),
  get: (projectId: string, id: string) => api.get(`/projects/${projectId}/tasks/${id}`),
  create: (projectId: string, data: { title: string; description?: string }) =>
    api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId: string, id: string, data: Partial<{ title: string; description: string; status: TaskStatus }>) =>
    api.patch(`/projects/${projectId}/tasks/${id}`, data),
  delete: (projectId: string, id: string) => api.delete(`/projects/${projectId}/tasks/${id}`),
}
