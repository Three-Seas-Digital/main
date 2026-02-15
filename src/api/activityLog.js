import api from './client.js';

export const activityLogApi = {
  getAll: (params) => api.get('/activity-log', { params }).then(r => r.data),
};
