import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const notificationsApi = {
  getAll: (params?: QueryParams) => api.get('/notifications', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/notifications/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/notifications', data).then(r => r.data),
  delete: (id: string) => api.delete(`/notifications/${id}`).then(r => r.data),
  markRead: (id: string) => api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put('/notifications/read-all').then(r => r.data),
  clearAll: () => api.delete('/notifications/all').then(r => r.data),
};
