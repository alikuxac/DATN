import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/stats.service';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });
};

import { getReportPerformanceStats } from '../services/stats.service';

export const useReportPerformanceStats = () => {
  return useQuery({
    queryKey: ['report-performance-stats'],
    queryFn: getReportPerformanceStats,
  });
};
