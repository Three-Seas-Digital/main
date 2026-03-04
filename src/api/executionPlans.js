import api from './client.js';

export const executionPlansApi = {
  getForClient: (clientId) =>
    api.get(`/clients/${clientId}/execution-plans`).then(r => r.data),
  create: (clientId, data) =>
    api.post(`/clients/${clientId}/execution-plans`, data).then(r => r.data),
  update: (clientId, id, data) =>
    api.put(`/clients/${clientId}/execution-plans/${id}`, data).then(r => r.data),
  delete: (clientId, id) =>
    api.delete(`/clients/${clientId}/execution-plans/${id}`).then(r => r.data),
};
