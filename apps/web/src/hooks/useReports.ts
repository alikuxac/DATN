import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Report, ReportStatus, ApiResponse, ReportType, ReportSeverity } from "@/types";

interface ReportsParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: ReportStatus | ReportStatus[] | "ALL";
  source?: "app" | "guest" | "ALL";
  fromDate?: string; // ISO string
  toDate?: string;   // ISO string
  dateField?: 'createdAt' | 'updatedAt';
}

interface UpdateReportStatusParams {
  id: string;
  status: ReportStatus;
}

interface RejectReportParams {
  id: string;
  reason: string;
}

export interface CreateReportRequest {
  userId: string;
  type: ReportType;
  coordinates: [number, number]; // [lng, lat]
  regionId: string;
  notes?: string;
  severity?: ReportSeverity;
  peopleCount?: number;
  isPublic?: boolean;
}

// Define response type locally to match API actual response (which differs from shared type)
interface ReportsResponse {
  data: Report[];
  _metadata: {
    pagination: {
      total: number;
      totalPage: number;
    };
  };
}

export function useReports(params: ReportsParams) {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      // Build status param - handle array for tabs
      let statusParam: string | undefined;
      if (params.status && params.status !== 'ALL') {
        statusParam = Array.isArray(params.status)
          ? params.status.join(',')  // API accepts comma-separated values
          : params.status;
      }

      const { data } = await api.get<ReportsResponse>('/admin/report/list', {
        params: {
          page: params.page || 1,
          perPage: params.limit || 10,
          _offset: ((params.page || 1) - 1) * (params.limit || 10),
          _limit: params.limit || 10,
          search: params.q,
          status: statusParam,
          source: (params.source === 'ALL' || !params.source) ? undefined : params.source,
          fromDate: params.fromDate,
          toDate: params.toDate,
          dateField: params.dateField || 'createdAt',
        },
      });
      return data;
    },
    placeholderData: (previousData) => previousData,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: UpdateReportStatusParams) => {
      const { data } = await api.patch<ApiResponse<Report>>(`/reports/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const rejectReportMutation = useMutation({
    mutationFn: async ({ id, reason }: RejectReportParams) => {
      const { data } = await api.post<ApiResponse<Report>>(`/user/report/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (payload: CreateReportRequest) => {
      const { data } = await api.post<ApiResponse<Report>>('/admin/report/create', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return {
    reports: reportsQuery.data?.data || [],
    metadata: reportsQuery.data?._metadata?.pagination,
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    error: reportsQuery.error,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    rejectReport: rejectReportMutation.mutate,
    isRejecting: rejectReportMutation.isPending,
    createReport: createReportMutation.mutate,
    isCreating: createReportMutation.isPending,
  };
}
