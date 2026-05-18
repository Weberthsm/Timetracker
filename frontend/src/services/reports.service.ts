import api from './api'

export const reportsService = {
  // userId is required by the backend – always pass the target user's ID
  daily: (params: { date: string; userId: string }) =>
    api.get('/reports/daily', { params }),
  monthly: (params: { month: string; userId: string }) =>
    api.get('/reports/monthly', { params }),
  team: (params: { teamId: string; month: string }) =>
    api.get('/reports/team', { params }),
  allocation: (params: { granularity: 'day' | 'month' | 'year'; value: string }) =>
    api.get('/reports/allocation', { params }),
}
