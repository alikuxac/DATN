import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import api, { API_URL } from "@/lib/axios";
import { LoginResponse, UserProfileResponse, UserRole } from "@/types";

interface LoginCredentials {
  email: string; // or username as per prompt
  password: string;
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {

      // Get or create deviceId
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('deviceId', deviceId);
      }

      try {
        // Step 1: Login to get tokens
        const { data: loginData } = await api.post<{ data: LoginResponse }>('/public/auth/login/credential', credentials, {
          headers: {
            'x-platform': 'WEB',
            'x-device-id': deviceId,
            'x-device-name': navigator.userAgent,
          }
        });

        console.log('Login response:', {
          data: loginData
        });

        console.log('Login response:', {
          hasAccessToken: !!loginData.data.accessToken,
          hasRefreshToken: !!loginData.data.refreshToken
        });

        // Step 2: Fetch user profile with the access token (pass directly in header)
        const { data: profileData } = await api.get<{ data: UserProfileResponse }>('/shared/user/profile', {
          headers: {
            Authorization: `Bearer ${loginData.data.accessToken}`
          }
        });

        console.log('Profile fetched:', {
          userId: profileData.data._id,
          role: profileData.data.role
        });

        // Step 3: Validate role before saving tokens
        const allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
        console.log('Role validation:', {
          userRole: profileData.data.role,
          allowedRoles,
          isAllowed: allowedRoles.includes(profileData.data.role)
        });

        if (!allowedRoles.includes(profileData.data.role)) {
          throw new Error("Access Denied: You do not have permission to access this dashboard.");
        }

        // Step 4: Save tokens AFTER successful validation
        Cookies.set('accessToken', loginData.data.accessToken);
        Cookies.set('refreshToken', loginData.data.refreshToken);

        console.log('Tokens saved to cookies');

        return {
          tokens: loginData,
          user: profileData
        };
      } catch (error: any) {
        let errorMessage = error.message;

        if (axios.isAxiosError(error) && error.response?.data) {
          const data = error.response.data as any;
          if (data.message) {
            errorMessage = Array.isArray(data.message) ? data.message[0] : data.message;
          }
        }

        console.error("❌ Login failed");
        console.error("Error details:", {
          message: errorMessage,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });

        throw new Error(errorMessage);
      }
    },
    onSuccess: ({ tokens, user }) => {
      console.log('✅ Login successful:', { tokens, user });

      // Save user info to cookies
      Cookies.set('user', JSON.stringify(user), { expires: 7 });

      // Sync preferences
      if (user.data.preferences) {
        if (user.data.preferences.theme) {
          Cookies.set('vite-ui-theme', user.data.preferences.theme.toLowerCase(), { expires: 7 });
        }
        if (user.data.preferences.language) {
          Cookies.set('app-language', user.data.preferences.language.toLowerCase(), { expires: 7 });
        }
      }

      console.log('✅ User and preferences saved to cookies');

      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      console.error("❌ Login failed in mutation onError");

      // Clean up tokens on error
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      Cookies.remove('vite-ui-theme');
      Cookies.remove('app-language');
    }
  });

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    Cookies.remove('vite-ui-theme');
    Cookies.remove('app-language');
    queryClient.clear();
    router.push('/auth/login');
  };

  // Get user from cookie
  const getUser = () => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        return JSON.parse(userCookie) as { data: UserProfileResponse };
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  return {
    user: getUser(),
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
