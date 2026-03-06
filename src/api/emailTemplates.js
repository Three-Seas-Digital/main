import api from './client.js';

export const emailTemplatesApi = {
  getAll: (params) => api.get('/email-templates', { params }).then(r => r.data),
  getById: (id) => api.get(`/email-templates/${id}`).then(r => r.data),
  create: (data) => api.post('/email-templates', data).then(r => r.data),
  update: (id, data) => api.put(`/email-templates/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/email-templates/${id}`).then(r => r.data),
  sendWelcome: (clientId, options = {}) =>
    api.post('/email-templates/send-welcome', { clientId, ...options }).then(r => r.data),
};
