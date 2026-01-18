import api from '@/lib/axios';
import { DashboardStats } from '../types/stats';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/admin/stats/dashboard');
  if (data && data.data) {
    return data.data;
  }
  return data;
};

export interface ReportPerformanceStats {
  avgResponseTime: number;
  avgRescueTime: number;
  avgTotalTime: number;
  count: number;
}

export const getReportPerformanceStats = async (): Promise<ReportPerformanceStats> => {
  const { data } = await api.get('/admin/report/stats'); // Controller path is /report/stats
  return data;
};
