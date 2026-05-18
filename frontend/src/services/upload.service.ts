import api from './api'

export const uploadService = {
  uploadProjectLogo: (projectId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ data: { logoUrl: string } }>(`/upload/projects/${projectId}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  removeProjectLogo: (projectId: string) =>
    api.delete(`/upload/projects/${projectId}/logo`),

  uploadAvatar: (file: File, userId?: string) => {
    const form = new FormData()
    form.append('file', file)
    const params = userId ? { userId } : {}
    return api.post<{ data: { avatarUrl: string } }>('/upload/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    })
  },

  removeAvatar: (userId?: string) =>
    api.delete('/upload/avatar', { params: userId ? { userId } : {} }),
}
