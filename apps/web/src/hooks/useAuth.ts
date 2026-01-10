import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
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
      // Step 1: Login to get tokens
      const { data: loginData } = await api.post<{ data: LoginResponse }>('/public/auth/login/credential', credentials);

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
    },
    onSuccess: ({ tokens, user }) => {
      console.log('✅ Login successful:', { tokens, user });

      // Save user info to cookies
      Cookies.set('user', JSON.stringify(user), { expires: 7 }); // Expires in 7 days

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

      // TEMPORARILY COMMENTED FOR DEBUGGING - Uncomment after fixing
      // Use window.location.href instead of router.push to ensure cookies are set
      // before dashboard layout mounts and checks for them
      window.location.href = '/dashboard';

      console.log('🎉 Login flow completed successfully! (Redirect disabled for debugging)');
    },
    onError: (error: any) => {
      console.error("❌ Login failed");
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });

      // Clean up tokens on error
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      Cookies.remove('vite-ui-theme');
      Cookies.remove('app-language');
      console.log('🧹 Cleaned up cookies after error');
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
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
