import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { UserProfileResponse, UserGender } from "@/types";
import Cookies from "js-cookie";

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  gender?: UserGender;
  // address?: string; // Add if API supports it
}

export function useProfile() {
  const queryClient = useQueryClient();

  // Helper to update cookie
  const updateCookie = (updatedUser: Partial<UserProfileResponse>) => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      const currentUser = JSON.parse(userCookie);
      const newUser = { ...currentUser, ...updatedUser };
      Cookies.set("user", JSON.stringify(newUser), { expires: 7 });
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const { data: res } = await api.put<{ data: UserProfileResponse }>('/user/profile/update', data);
      return res;
    },
    onSuccess: (response) => {
      updateCookie(response.data);
      queryClient.invalidateQueries({ queryKey: ["users", "me"] }); // Invalidating 'users' might not be enough if we use specific key
      // If we use useAuth, we might need to reload window or just rely on cookie update + react state?
      // useAuth reads from cookie on mount. 
      // For instant update, we might need to use a global store or context, but cookie update + router refresh works.

      toast.success("Profile updated successfully");
      // Trigger a re-render of components using useAuth if possible, or just rely on window reload if needed.
      // But ideally we should have a ProfileContext or useQuery for profile.
      // For now, let's just force a reload of the page or just update the UI optimistically if we had local state.
      window.location.reload(); // Simple way to refresh header info
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  return {
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
  };
}
