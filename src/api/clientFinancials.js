import api from './client.js';

export const clientFinancialsApi = {
  // Get all financial records for a client (with optional date range)
  getForClient: (clientId, dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startYear) params.append('startYear', dateRange.startYear);
    if (dateRange.startMonth) params.append('startMonth', dateRange.startMonth);
    if (dateRange.endYear) params.append('endYear', dateRange.endYear);
    if (dateRange.endMonth) params.append('endMonth', dateRange.endMonth);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/clients/${clientId}/financials${query}`).then(r => r.data);
  },

  // Create a new financial record
  create: (clientId, data) =>
    api.post(`/clients/${clientId}/financials`, data).then(r => r.data),

  // Update a financial record
  update: (clientId, id, data) =>
    api.put(`/clients/${clientId}/financials/${id}`, data).then(r => r.data),

  // Delete a financial record
  delete: (clientId, id) =>
    api.delete(`/clients/${clientId}/financials/${id}`).then(r => r.data),

  // Get aggregate summary
  getSummary: (clientId, dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startYear) params.append('startYear', dateRange.startYear);
    if (dateRange.startMonth) params.append('startMonth', dateRange.startMonth);
    if (dateRange.endYear) params.append('endYear', dateRange.endYear);
    if (dateRange.endMonth) params.append('endMonth', dateRange.endMonth);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/clients/${clientId}/financials/summary${query}`).then(r => r.data);
  },

  // Get revenue by channel breakdown
  getChannels: (clientId, dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startYear) params.append('startYear', dateRange.startYear);
    if (dateRange.startMonth) params.append('startMonth', dateRange.startMonth);
    if (dateRange.endYear) params.append('endYear', dateRange.endYear);
    if (dateRange.endMonth) params.append('endMonth', dateRange.endMonth);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/clients/${clientId}/financials/channels${query}`).then(r => r.data);
  },

  // Get revenue by product breakdown
  getProducts: (clientId, dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startYear) params.append('startYear', dateRange.startYear);
    if (dateRange.startMonth) params.append('startMonth', dateRange.startMonth);
    if (dateRange.endYear) params.append('endYear', dateRange.endYear);
    if (dateRange.endMonth) params.append('endMonth', dateRange.endMonth);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/clients/${clientId}/financials/products${query}`).then(r => r.data);
  },

  // Get ad spend data with ROAS calculation
  getAdSpend: (clientId, dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startYear) params.append('startYear', dateRange.startYear);
    if (dateRange.startMonth) params.append('startMonth', dateRange.startMonth);
    if (dateRange.endYear) params.append('endYear', dateRange.endYear);
    if (dateRange.endMonth) params.append('endMonth', dateRange.endMonth);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/clients/${clientId}/financials/ad-spend${query}`).then(r => r.data);
  },

  // Create ad spend record
  createAdSpend: (clientId, data) =>
    api.post(`/clients/${clientId}/financials/ad-spend`, data).then(r => r.data),

  // Update ad spend record
  updateAdSpend: (clientId, id, data) =>
    api.put(`/clients/${clientId}/financials/ad-spend/${id}`, data).then(r => r.data),
};
