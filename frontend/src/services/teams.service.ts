import api from './api'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  avatarUrl: string | null
}

export interface Team {
  id: string
  name: string
  membersCount?: number
  members?: TeamMember[]
}

export const teamsService = {
  list: (params?: Record<string, string>) => api.get('/teams', { params }),
  get: (id: string) => api.get(`/teams/${id}`),
  create: (data: { name: string }) => api.post('/teams', data),
  update: (id: string, data: { name: string }) => api.patch(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  addMember: (teamId: string, userId: string) =>
    api.post(`/teams/${teamId}/members`, { userId }),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
}
