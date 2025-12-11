import { store } from "@/store";
import { setToken } from "@/store/slices/appSlice";
// src/services/api.service.ts

class ApiService {
  // Thay đổi URL này tùy theo môi trường của bạn (localhost, IP LAN, v.v.)
  private baseUrl = 'http://localhost:3000/api';

  private accessToken: string | null = null;

  setAuthToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Tự động thêm Authorization Header nếu có token
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options, // Spread các options khác (method, signal...)
      headers: {
        ...defaultHeaders,
        ...options.headers, // Ghi đè headers nếu truyền từ bên ngoài
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        store.dispatch(setToken(null));

        throw new Error('Session expired');
      }

      // Xử lý lỗi từ Backend trả về (nếu có)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // 👇 Cập nhật các hàm để nhận thêm tham số 'options'
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiService = new ApiService();