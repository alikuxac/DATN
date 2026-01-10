export class StatsDashboardResponseDto {
  users: {
    total: number;
    active: number;
  };
  reports: {
    total: number;
    resolved: number;
  }
  charts: {
    users: { date: string, count: number }[];
    reports: { date: string, count: number }[];
  }
}
