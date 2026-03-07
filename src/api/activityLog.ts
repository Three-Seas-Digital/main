import api from './client';

type QueryParams = Record<string, string | number | boolean | undefined>;

export const activityLogApi = {
  getAll: (params?: QueryParams) => api.get('/activity-log', { params }).then(r => r.data),
};
