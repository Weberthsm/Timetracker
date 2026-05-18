import api from './api'

export interface UserOption {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string | null
}

export const usersService = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
}
