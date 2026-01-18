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
          // Use fetch or a separate axios instance to avoid interceptor loop
          const response = await fetch(`${API_URL}/shared/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshToken}`,
            },
          });

          if (response.ok) {
            const resData = await response.json();
            const { accessToken, refreshToken: newRefreshToken, user } = resData.data;

            // Update Cookies
            Cookies.set('accessToken', accessToken);
            Cookies.set('refreshToken', newRefreshToken);
            if (user) {
              Cookies.set('user', JSON.stringify(user));
            }

            // Update Authorization header and retry
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Fall through to logout
      }

      // If refresh failed or no refresh token
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
