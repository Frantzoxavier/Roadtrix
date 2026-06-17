import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('roadtrix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['roadtrix_token', 'roadtrix_user']);
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const driverApi = {
  getProfile: () => api.get('/drivers/me'),
  updateStatus: (status: string) => api.patch('/drivers/me', { status }),
  getActiveLoad: () => api.get('/drivers/me/active-load'),
};

export const loadsApi = {
  getMyLoads: (params?: Record<string, string>) => api.get('/loads', { params }),
  getById: (id: string) => api.get(`/loads/${id}`),
  accept: (id: string) => api.post(`/loads/${id}/accept`),
  decline: (id: string) => api.post(`/loads/${id}/decline`),
  startTrip: (id: string) => api.post(`/loads/${id}/start`),
  pickup: (id: string) => api.post(`/loads/${id}/pickup`),
  deliver: (id: string, formData: FormData) =>
    api.post(`/loads/${id}/deliver`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const paymentsApi = {
  getMyPayments: () => api.get('/payments'),
};

export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (otherUserId: string) => api.get('/messages', { params: { otherUserId } }),
  send: (receiverId: string, message: string) => api.post('/messages', { receiverId, message }),
};
