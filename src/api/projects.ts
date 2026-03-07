import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const projectsApi = {
  getAll: (params?: QueryParams) => api.get('/projects', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data: Record<string, unknown>) => api.post('/projects', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then(r => r.data),
  // Tasks
  addTask: (id: string, task: Record<string, unknown>) => api.post(`/projects/${id}/tasks`, task).then(r => r.data),
  updateTask: (id: string, taskId: string, data: Record<string, unknown>) => api.put(`/projects/${id}/tasks/${taskId}`, data).then(r => r.data),
  deleteTask: (id: string, taskId: string) => api.delete(`/projects/${id}/tasks/${taskId}`).then(r => r.data),
  // Milestones
  addMilestone: (id: string, milestone: Record<string, unknown>) => api.post(`/projects/${id}/milestones`, milestone).then(r => r.data),
  updateMilestone: (id: string, milestoneId: string, data: Record<string, unknown>) => api.put(`/projects/${id}/milestones/${milestoneId}`, data).then(r => r.data),
  deleteMilestone: (id: string, milestoneId: string) => api.delete(`/projects/${id}/milestones/${milestoneId}`).then(r => r.data),
  // Developers
  addDeveloper: (id: string, userId: string) => api.post(`/projects/${id}/developers`, { userId }).then(r => r.data),
  removeDeveloper: (id: string, userId: string) => api.delete(`/projects/${id}/developers/${userId}`).then(r => r.data),
};
