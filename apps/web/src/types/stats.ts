export interface DashboardStats {
  users: {
    total: number;
    active: number;
    diff: number;
  };
  reports: {
    total: number;
    resolved: number;
    diff: number;
  };
  charts: {
    users: { date: string, count: number }[];
    reports: { date: string, count: number }[];
    rescuesTrend: { date: string, count: number }[];
    hotspots: { _id: string, count: number, name?: string }[];
  };
}
