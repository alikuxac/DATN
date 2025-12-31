import { store } from "@/store";
import { setToken } from "@/store/slices/appSlice";

// 1. Cập nhật ApiError để chứa "code" (App Status Code)
export class ApiError extends Error {
  status: number; // HTTP Status (400, 401, 500)
  code: number;   // App Status Code (5310, 5000...) << QUAN TRỌNG
  data: any;      // Body response

  constructor(status: number, code: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code; // Lưu lại để switch case
    this.data = data;
  }
}

class ApiService {
  private baseUrl = `${process.env.EXPO_PUBLIC_API_URL}/api`;
  private accessToken: string | null = null;

  constructor(){
    console.log('API Base URL:', process.env.EXPO_PUBLIC_API_URL);
  }

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

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-custom-lang': language
    };

    if (this.accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    };

    try {
      const response = await fetch(url, config);

      // Xử lý 401
      if (response.status === 401) {
        store.dispatch(setToken(null));
        // Với 401, thường App Code cũng là 51xx, ta có thể hardcode hoặc parse body nếu có
        throw new ApiError(401, 5100, 'Session expired');
      }

      if (response.status === 204) {
        return {} as any;
      }

      const responseText = await response.text();
      let responseBody: any;
      try {
        responseBody = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        responseBody = { message: responseText };
      }

      // 2. Logic ném lỗi mới
      if (!response.ok) {
        // Ưu tiên lấy statusCode từ body, nếu không có thì lấy HTTP status
        const appCode = responseBody.statusCode || response.status;

        const errorMessage =
          Array.isArray(responseBody.message)
            ? responseBody.message[0]
            : responseBody.message || `HTTP Error ${response.status}`;

        throw new ApiError(
          response.status, // HTTP Code (để debug)
          appCode,         // App Code (để switch case logic)
          errorMessage,
          responseBody
        );
      }

      return responseBody as T;

    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('[API Error]:', error);
      // Lỗi mạng hoặc lỗi không xác định -> Code 0 hoặc 5000 (APP_UNKNOWN)
      throw new ApiError(0, 5000, 'Network Error', error);
    }
  }

  // ... Các hàm get, post, put, delete giữ nguyên ...
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

  async patch<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiService = new ApiService();