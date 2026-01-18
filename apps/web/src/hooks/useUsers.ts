import {
  User,
  UserListResponse,
  UserRole,
  UserStatus,
  UserGender,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { ENUM_USER_ROLE, IResponse as ApiResponse } from "@repo/shared";

interface UseUsersParams {
  page: number;
  limit: number;
  q?: string;
  role?: UserRole;
  status?: UserStatus | "DELETED";
}

interface UsersResponse {
  data: UserListResponse[];
  _pagination: {
    total: number;
    totalPage: number;
  };
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender: UserGender;
  mobileNumber: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  mobileNumber?: string;
}

interface UpdateUserRoleRequest {
  role: UserRole;
}

export function useUsers(params: UseUsersParams) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const queryParams: any = {
        page: params.page,
        perPage: params.limit,
      };

      if (params.q) queryParams.search = params.q;
      if (params.role) queryParams.role = params.role;
      if (params.status) queryParams.status = params.status;

      const { data } = await api.get<UsersResponse>('/admin/user/list', { params: queryParams });
      return data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: CreateUserRequest) => {
      // Provide a dummy password if not provided, to satisfy DTO validation
      const body = { ...payload, password: payload.password || 'TempPass123!' };
      const { data } = await api.post<ApiResponse<{ _id: string }>>('/admin/user/create', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserRequest }) => {
      const { data: res } = await api.put<ApiResponse<void>>(`/admin/user/update/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/user/delete/${id}`);
      console.log(data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: UserStatus;
    }) => {
      const { data } = await api.patch<ApiResponse<void>>(`/admin/user/update/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    },
  });

  const resetUserPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<ApiResponse<void>>(`/admin/user/update/${id}/reset-password`);
      return data;
    },
    onSuccess: () => {
      toast.success("Password reset successfully. Email sent to user.");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to reset password"
      );
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { data } = await api.patch<ApiResponse<void>>(`/admin/user/update/${id}/role`, {
        role,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user role");
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<void>>(`/admin/user/update/${id}/restore`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User restored successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to restore user");
    },
  });

  const revokeAllUserSessionsMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete<ApiResponse<void>>(`/session/revoke-all/${userId}`); // Check if this endpoint matches controller
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("All sessions revoked for user");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke sessions");
    },
  });

  const cleanUpExpiredSessionsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<ApiResponse<void>>('/session/cleanup'); // Check controller path
      return data;
    },
    onSuccess: () => {
      toast.success("Expired sessions cleaned up successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cleanup sessions");
    }
  });

  return {
    users: data?.data || [],
    metadata: data?._pagination,
    isLoading,
    error,
    refetch,
    createUser: createUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    updateUser: updateUserMutation.mutate,
    isUpdating: updateUserMutation.isPending,
    deleteUser: deleteUserMutation.mutate,
    isDeleting: deleteUserMutation.isPending,
    updateUserStatus: updateUserStatusMutation.mutate,
    isUpdatingStatus: updateUserStatusMutation.isPending,
    resetUserPassword: resetUserPasswordMutation.mutate,
    isResettingPassword: resetUserPasswordMutation.isPending,
    updateUserRole: updateUserRoleMutation.mutate,
    isUpdatingRole: updateUserRoleMutation.isPending,
    restoreUser: restoreUserMutation.mutate,
    isRestoring: restoreUserMutation.isPending,
    revokeAllUserSessions: revokeAllUserSessionsMutation.mutate,
    isRevokingAll: revokeAllUserSessionsMutation.isPending,
    cleanUpExpiredSessions: cleanUpExpiredSessionsMutation.mutate,
    isCleaningUp: cleanUpExpiredSessionsMutation.isPending,
  };
}
