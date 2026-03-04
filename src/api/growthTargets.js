import api from './client.js';

export const growthTargetsApi = {
  getForClient: (clientId) =>
    api.get(`/clients/${clientId}/growth-targets`).then(r => r.data),
  create: (clientId, data) =>
    api.post(`/clients/${clientId}/growth-targets`, data).then(r => r.data),
  update: (clientId, id, data) =>
    api.put(`/clients/${clientId}/growth-targets/${id}`, data).then(r => r.data),
  delete: (clientId, id) =>
    api.delete(`/clients/${clientId}/growth-targets/${id}`).then(r => r.data),
  addSnapshot: (clientId, targetId, data) =>
    api.post(`/clients/${clientId}/growth-targets/${targetId}/snapshots`, data).then(r => r.data),
  getSnapshots: (clientId, targetId) =>
    api.get(`/clients/${clientId}/growth-targets/${targetId}/snapshots`).then(r => r.data),
};
