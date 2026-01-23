import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { getDashboardStats } from '../services/stats.service';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: !!Cookies.get('accessToken'), // Only fetch when token exists
  });
};

import { getReportPerformanceStats } from '../services/stats.service';

export const useReportPerformanceStats = () => {
  return useQuery({
    queryKey: ['report-performance-stats'],
    queryFn: getReportPerformanceStats,
    enabled: !!Cookies.get('accessToken'),
  });
};
