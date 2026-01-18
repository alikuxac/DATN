import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface PaginationState {
  page: number;
  limit: number;
}

export interface SessionData {
  _id: string;
  deviceName: string;
  os: string;
  ip: string;
  lastActiveAt: string;
  isCurrent: boolean;
  status: string;
  platform: string;
}

export const useSession = ({ page, limit }: PaginationState) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", page, limit],
    queryFn: async () => {
      const res = await api.get("/shared/session/list", {
        params: { _page: page, _limit: limit },
      });
      return res.data;
    },
  });

  const { mutate: revokeSession, isPending: isRevoking } = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/shared/session/revoke/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  return {
    sessions: (data?.data as SessionData[]) || [],
    metadata: data?._pagination,
    isLoading,
    revokeSession,
    isRevoking,
  };
};
