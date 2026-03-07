import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const emailTemplatesApi = {
  getAll: (params?: QueryParams) => api.get('/email-templates', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/email-templates/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/email-templates', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/email-templates/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/email-templates/${id}`).then(r => r.data),
  sendWelcome: (clientId: string, options: Record<string, unknown> = {}) =>
    api.post('/email-templates/send-welcome', { clientId, ...options }).then(r => r.data),
};
