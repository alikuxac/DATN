import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/stats.service';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });
};
