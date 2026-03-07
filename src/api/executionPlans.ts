import api from './client';

export const executionPlansApi = {
  getForClient: (clientId: string) =>
    api.get(`/clients/${clientId}/execution-plans`).then(r => r.data),
  create: (clientId: string, data: Record<string, unknown>) =>
    api.post(`/clients/${clientId}/execution-plans`, data).then(r => r.data),
  update: (clientId: string, id: string, data: Record<string, unknown>) =>
    api.put(`/clients/${clientId}/execution-plans/${id}`, data).then(r => r.data),
  delete: (clientId: string, id: string) =>
    api.delete(`/clients/${clientId}/execution-plans/${id}`).then(r => r.data),
};
