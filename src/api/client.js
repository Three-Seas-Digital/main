import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('threeseas_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 with TOKEN_EXPIRED and we haven't retried yet
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('threeseas_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        // Use the correct refresh endpoint based on session type
        const isClientSession = !!localStorage.getItem('threeseas_current_client');
        const refreshUrl = isClientSession ? `${API_BASE}/client-auth/refresh` : `${API_BASE}/auth/refresh`;
        const { data } = await axios.post(refreshUrl, {
          refreshToken,
        });

        localStorage.setItem('threeseas_access_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('threeseas_refresh_token', data.refreshToken);
        }
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('threeseas_access_token');
        localStorage.removeItem('threeseas_refresh_token');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
