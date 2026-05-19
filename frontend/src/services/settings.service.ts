import api from './api'

export interface SystemSettings {
  requireEmailVerification: boolean
  allowTimesMode: boolean
  allowStartDurationMode: boolean
  allowDurationOnlyMode: boolean
}

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data: Partial<SystemSettings>) => api.patch('/settings', data),
}
