import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('roadtrix_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('roadtrix_token');
      localStorage.removeItem('roadtrix_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// ─── Drivers ─────────────────────────────────────────────────────────────────
export const driversApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/drivers', { params }),
  getById: (id: string) => api.get(`/drivers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/drivers', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  // Driver self-service
  getMe: () => api.get('/drivers/me'),
  getActiveLoad: () => api.get('/drivers/me/active-load'),
};

// ─── Loads ────────────────────────────────────────────────────────────────────
export const loadsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/loads', { params }),
  getById: (id: string) => api.get(`/loads/${id}`),
  create: (data: Record<string, unknown>) => api.post('/loads', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/loads/${id}`, data),
  delete: (id: string) => api.delete(`/loads/${id}`),
  assign: (loadId: string, driverId: string) =>
    api.post(`/loads/${loadId}/assign`, { driverId }),
  // Driver lifecycle actions
  accept: (id: string) => api.post(`/loads/${id}/accept`),
  decline: (id: string) => api.post(`/loads/${id}/decline`),
  start: (id: string) => api.post(`/loads/${id}/start`),
  pickup: (id: string) => api.post(`/loads/${id}/pickup`),
  deliver: (id: string, formData: FormData) =>
    api.post(`/loads/${id}/deliver`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/payments', { params }),
  create: (data: Record<string, unknown>) => api.post('/payments', data),
  process: (id: string) => api.patch(`/payments/${id}/process`),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: () => api.get('/analytics'),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (otherUserId?: string) =>
    api.get('/messages', { params: otherUserId ? { otherUserId } : {} }),
  send: (receiverId: string, message: string) =>
    api.post('/messages', { receiverId, message }),
};
