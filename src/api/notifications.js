import api from './client.js';

export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }).then(r => r.data),
  getById: (id) => api.get(`/notifications/${id}`).then(r => r.data),
  create: (data) => api.post('/notifications', data).then(r => r.data),
  delete: (id) => api.delete(`/notifications/${id}`).then(r => r.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put('/notifications/read-all').then(r => r.data),
  clearAll: () => api.delete('/notifications/all').then(r => r.data),
};
