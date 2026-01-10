import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: false - not needed when using Next.js proxy
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          // Assuming there is an endpoint to refresh token
          // For now, if 401, we might just redirect to login if refresh fails
          // But typically: const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          // Cookies.set('accessToken', data.accessToken);
          // return api(originalRequest);
        }
      } catch (refreshError) {
        // Handle refresh error (logout)
      }
      // If no refresh logic or failed:
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      if (typeof window !== 'undefined') {
        Cookies.remove('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
