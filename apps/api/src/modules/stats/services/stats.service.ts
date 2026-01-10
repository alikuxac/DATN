import { Injectable } from '@nestjs/common';
import { UsersService } from '@modules/users/services/users.service';
import { ReportService } from '@modules/reports/services/reports.service';
import { ENUM_USER_STATUS, ENUM_REPORT_STATUS } from '@repo/shared';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { StatsDashboardResponseDto } from '../dtos/response/stats.dashboard.response.dto';

@Injectable()
export class StatsService {
  constructor(
    private readonly helperDateService: HelperDateService
  ) { }

  async getDashboardStats(
    usersService: UsersService,
    reportService: ReportService
  ): Promise<StatsDashboardResponseDto> {
    const timezone = '+07:00'; // Hardcoded for now, or match app config
    const todayStart = this.helperDateService.startOfDay(new Date());
    const date30DaysAgo = this.helperDateService.backwardInDays(30);

    // 1. Summary Counts & Diffs
    // Current Totals
    const [totalUsers, activeUsers, totalReports, resolvedReports] = await Promise.all([
      usersService.getTotal({}), // Total ever
      usersService.getTotal({ status: ENUM_USER_STATUS.ACTIVE }),
      reportService.getTotal({}),
      reportService.getTotal({ status: ENUM_REPORT_STATUS.RESOLVED })
    ]);

    // Totals at end of yesterday (effectively < todayStart)
    const [usersBeforeToday, reportsBeforeToday] = await Promise.all([
      usersService.getTotal({ createdAt: { $lt: todayStart } }),
      reportService.getTotal({ createdAt: { $lt: todayStart } })
    ]);

    // Diffs
    const userDiff = totalUsers - usersBeforeToday;
    const reportDiff = totalReports - reportsBeforeToday;

    // 2. Cumulative Charts (Last 30 days)
    // We need the "Base Total" before the 30-day window starts
    const [userBaseTotal, reportBaseTotal] = await Promise.all([
      usersService.getTotal({ createdAt: { $lt: date30DaysAgo } }),
      reportService.getTotal({ createdAt: { $lt: date30DaysAgo } })
    ]);

    // Daily Growth (New items per day)
    const dateNow = this.helperDateService.create();
    const [userChartData, reportChartData] = await Promise.all([
      usersService.getGrowthStats(date30DaysAgo, dateNow, timezone),
      reportService.getGrowthStats(date30DaysAgo, dateNow, timezone)
    ]);

    // Calculate Cumulative
    const users = this.fillCumulativeDates(userChartData, date30DaysAgo, dateNow, userBaseTotal);
    const reports = this.fillCumulativeDates(reportChartData, date30DaysAgo, dateNow, reportBaseTotal);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        diff: userDiff
      },
      reports: {
        total: totalReports,
        resolved: resolvedReports,
        diff: reportDiff
      },
      charts: {
        users,
        reports
      }
    };
  }

  private fillCumulativeDates(data: { _id: string, count: number }[], startDate: Date, endDate: Date, baseTotal: number) {
    const result = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const dataMap = new Map(data.map(item => [item._id, item.count]));

    let currentTotal = baseTotal;

    while (currentDate <= end) {
      const dateStr = this.helperDateService.format(currentDate, { format: 'yyyy-MM-dd' });
      const dailyNew = dataMap.get(dateStr) || 0;
      currentTotal += dailyNew;

      result.push({
        date: dateStr,
        count: currentTotal
      });
      currentDate = this.helperDateService.forwardInDays(1, { fromDate: currentDate });
    }
    return result;
  }
}
