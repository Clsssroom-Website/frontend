import axiosClient from '../config/axiosClient';
import type { AuthResponse, BaseResponse } from '../types/auth.types';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return axiosClient.post('/auth/login', { email, password });
  },

  register: async (data: Record<string, any>): Promise<AuthResponse> => {
    return axiosClient.post('/auth/register', data);
  },

  logout: async (): Promise<BaseResponse> => {
    return axiosClient.post('/auth/logout');
  },
};
