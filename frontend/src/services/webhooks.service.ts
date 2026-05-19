import api from './api'

export interface Webhook {
  id: string
  name: string
  url: string
  secret: string | null
  events: string[]
  reportGranularity: string | null
  isActive: boolean
  createdAt: string
}

export interface WebhookDelivery {
  id: string
  webhookDestinationId: string
  event: string
  statusCode: number | null
  responseBody: string | null
  attempt: number
  success: boolean
  deliveredAt: string
}

export const webhooksService = {
  list: () => api.get('/webhooks'),
  create: (data: { name: string; url: string; events: string[]; reportGranularity?: string }) => api.post('/webhooks', data),
  update: (id: string, data: Partial<{ name: string; url: string; isActive: boolean }>) =>
    api.patch(`/webhooks/${id}`, data),
  remove: (id: string) => api.delete(`/webhooks/${id}`),
  test: (id: string) => api.post(`/webhooks/${id}/test`),
  deliveries: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/webhooks/${id}/deliveries`, { params }),
}
