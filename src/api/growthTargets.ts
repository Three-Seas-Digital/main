import api from './client';

export const growthTargetsApi = {
  getForClient: (clientId: string) =>
    api.get(`/clients/${clientId}/growth-targets`).then(r => r.data),
  create: (clientId: string, data: Record<string, unknown>) =>
    api.post(`/clients/${clientId}/growth-targets`, data).then(r => r.data),
  update: (clientId: string, id: string, data: Record<string, unknown>) =>
    api.put(`/clients/${clientId}/growth-targets/${id}`, data).then(r => r.data),
  delete: (clientId: string, id: string) =>
    api.delete(`/clients/${clientId}/growth-targets/${id}`).then(r => r.data),
  addSnapshot: (clientId: string, targetId: string, data: Record<string, unknown>) =>
    api.post(`/clients/${clientId}/growth-targets/${targetId}/snapshots`, data).then(r => r.data),
  getSnapshots: (clientId: string, targetId: string) =>
    api.get(`/clients/${clientId}/growth-targets/${targetId}/snapshots`).then(r => r.data),
};
