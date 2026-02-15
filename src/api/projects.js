import api from './client.js';

export const projectsApi = {
  getAll: (params) => api.get('/projects', { params }).then(r => r.data),
  getById: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then(r => r.data),
  // Tasks
  addTask: (id, task) => api.post(`/projects/${id}/tasks`, task).then(r => r.data),
  updateTask: (id, taskId, data) => api.put(`/projects/${id}/tasks/${taskId}`, data).then(r => r.data),
  deleteTask: (id, taskId) => api.delete(`/projects/${id}/tasks/${taskId}`).then(r => r.data),
  // Milestones
  addMilestone: (id, milestone) => api.post(`/projects/${id}/milestones`, milestone).then(r => r.data),
  updateMilestone: (id, milestoneId, data) => api.put(`/projects/${id}/milestones/${milestoneId}`, data).then(r => r.data),
  deleteMilestone: (id, milestoneId) => api.delete(`/projects/${id}/milestones/${milestoneId}`).then(r => r.data),
  // Developers
  addDeveloper: (id, userId) => api.post(`/projects/${id}/developers`, { userId }).then(r => r.data),
  removeDeveloper: (id, userId) => api.delete(`/projects/${id}/developers/${userId}`).then(r => r.data),
};
