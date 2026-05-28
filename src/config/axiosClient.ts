import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import useAuthStore from '../store/useAuthStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute = originalRequest.url?.includes('/auth/');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (data.success && data.data.accessToken) {
          const newAccessToken = data.data.accessToken;
          useAuthStore.getState().setAccessToken(newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          const res = await axiosClient(originalRequest);
          return res;
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(new Error("Phiên đăng nhập đã hết hạn."));
      }
    }

    const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi kết nối!';
    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosClient;
