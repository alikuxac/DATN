import { apiService } from "./api.service";

export const authService = {
  requestPasswordReset: async (email: string) => {
    return apiService.post<{ data: { token: string } }>('/public/reset-password/request', { email });
  },

  verifyOTP: async (token: string, otp: string) => {
    return apiService.post<any>(`/public/reset-password/verify/${token}`, { otp });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiService.post<any>(`/public/reset-password/reset/${token}`, { newPassword });
  },
};
