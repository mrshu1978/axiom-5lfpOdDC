import { apiClient } from './apiClient';
import { AuthUser } from '../store/authStore';

export const authService = {
  login: () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${API_URL}/auth/google`;
  },

  logout: () => {
    return apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};