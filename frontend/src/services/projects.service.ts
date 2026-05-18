import api from './api'

function formData(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return fd
}

export interface ProjectTeam {
  teamId: string
  projectId: string
  team: { id: string; name: string }
}

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  status: 'active' | 'archived'
  logoUrl: string | null
  tasksCount?: number
  teamProjects?: ProjectTeam[]
}

export const projectsService = {
  list: (params?: Record<string, string>) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/projects', data),
  update: (id: string, data: Partial<{ name: string; description: string; color: string }>) =>
    api.patch(`/projects/${id}`, data),
  archive: (id: string) => api.delete(`/projects/${id}`),
  linkTeam: (projectId: string, teamId: string) =>
    api.post(`/projects/${projectId}/teams/${teamId}`),
  unlinkTeam: (projectId: string, teamId: string) =>
    api.delete(`/projects/${projectId}/teams/${teamId}`),
  uploadLogo: (id: string, file: File) =>
    api.post(`/upload/projects/${id}/logo`, formData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeLogo: (id: string) => api.delete(`/upload/projects/${id}/logo`),
}
