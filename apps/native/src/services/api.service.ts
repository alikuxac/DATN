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
    const state = store.getState();
    const language = state.app.language;

    // Tự động thêm Authorization Header nếu có token
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-custom-lang': language
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

      // 1. Xử lý 401 (Unauthorized) - Ưu tiên cao nhất
      if (response.status === 401) {
        store.dispatch(setToken(null));
        throw new Error('Session expired');
      }

      // 2. Xử lý 204 (No Content) 
      // Rất quan trọng cho API PUT/DELETE update preferences của bạn
      if (response.status === 204) {
        return {} as any; // Trả về object rỗng nếu server không trả dữ liệu
      }

      // 3. Đọc body dưới dạng TEXT trước (Tránh lỗi Body used & JSON parse)
      const responseText = await response.text();

      let data;
      try {
        // Cố gắng parse JSON
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        // Nếu server trả về HTML lỗi hoặc text thường -> gán data bằng text đó
        data = { message: responseText };
      }

      // 4. Kiểm tra lỗi HTTP (!ok)
      if (!response.ok) {
        // Lúc này 'data' chắc chắn đã có dữ liệu (JSON hoặc text)
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }

      // 5. Trả về data thành công
      return data;

    } catch (error) {
      console.error('[API Error]:', error);
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