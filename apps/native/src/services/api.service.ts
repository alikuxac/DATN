import { store } from "@/store";
import { logout, setRefreshToken, setToken } from "@/store/slices/appSlice";
import i18n from "@/config/i18n";

// 1. Cập nhật ApiError để chứa "code" (App Status Code)
export class ApiError extends Error {
  status: number; // HTTP Status (400, 401, 500)
  code: number;   // App Status Code (5310, 5000...) <<QUAN TRỌNG
  data: any;      // Body response

  constructor(status: number, code: number, message: string, data?: any) {
    super(message);
    // this.name = 'ApiError'; // Removed as per request
    this.status = status;
    this.code = code; // Lưu lại để switch case
    this.data = data;
  }
}

class ApiService {
  private baseUrl = `${process.env.EXPO_PUBLIC_API_URL}/api`;
  private accessToken: string | null = null;

  constructor() {
  }

  setAuthToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { _isRetry?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const state = store.getState();
    const language = state.app.language;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-custom-lang': language
    };

    const accessToken = this.accessToken || state.app.token;

    if (accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    };

    try {
      const response = await fetch(url, config);

      // Xử lý 401 - Session expired
      if (response.status === 401) {
        // Nếu không có token trong store, đây không phải là lỗi hết phiên -> chỉ là Unauthorized
        const currentToken = state.app.token || this.accessToken;
        if (!currentToken) {
          throw new ApiError(401, 401, "Không có quyền truy cập");
        }

        if (options._isRetry) {
          store.dispatch(logout());
          // throw new ApiError(401, 5100, i18n.t('AUTH.SESSION_EXPIRED'));
          return new Promise(() => { }) as any; // Silent logout
        }

        try {
          const refreshToken = state.app.refreshToken;
          if (!refreshToken) {
            store.dispatch(logout());
            // throw new ApiError(401, 5100, i18n.t('AUTH.SESSION_EXPIRED'));
            return new Promise(() => { }) as any; // Silent logout
          }

          // Call Refresh API
          const refreshResponse = await fetch(`${this.baseUrl}/shared/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshToken}`
            }
          });

          if (refreshResponse.ok) {
            const resData = await refreshResponse.json();
            const { accessToken, refreshToken: newRefreshToken } = resData.data;

            // Dispatch update store
            store.dispatch(setToken(accessToken));
            store.dispatch(setRefreshToken(newRefreshToken));
            this.setAuthToken(accessToken);

            // Retry original request
            return this.request<T>(endpoint, {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`
              },
              _isRetry: true
            });
          } else {
            store.dispatch(logout());
            // throw new ApiError(401, 5100, i18n.t('AUTH.SESSION_EXPIRED'));
            return new Promise(() => { }) as any; // Silent logout
          }
        } catch (error) {
          store.dispatch(logout());
          // throw new ApiError(401, 5100, i18n.t('AUTH.SESSION_EXPIRED'));
          return new Promise(() => { }) as any; // Silent logout
        }
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
            : responseBody.message || `Lỗi hệ thống (${response.status})`;

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
      throw new ApiError(0, 5000, 'Lỗi kết nối mạng', error);
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

  // Upload method for multipart/form-data
  async uploadFormData<T>(
    endpoint: string,
    formData: FormData,
    options?: Omit<RequestInit, 'body' | 'method'>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const state = store.getState();
    const language = state.app.language;

    const headers: Record<string, string> = {
      'x-custom-lang': language,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      method: 'POST',
      headers: { ...headers, ...options?.headers },
      body: formData,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        store.dispatch(logout());
        throw new ApiError(401, 5100, i18n.t('AUTH.SESSION_EXPIRED'));
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

      if (!response.ok) {
        const appCode = responseBody.statusCode || response.status;
        const errorMessage =
          Array.isArray(responseBody.message)
            ? responseBody.message[0]
            : responseBody.message || `Lỗi hệ thống (${response.status})`;

        throw new ApiError(response.status, appCode, errorMessage, responseBody);
      }

      return responseBody as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('[Upload Error]:', error);
      throw new ApiError(0, 5000, 'Lỗi kết nối mạng', error);
    }
  }
}

export const apiService = new ApiService();