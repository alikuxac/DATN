import api from '@/lib/axios';
import { DashboardStats } from '../types/stats';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/admin/stats/dashboard');
  if (data && data.data) {
    return data.data;
  }
  return data;
};
