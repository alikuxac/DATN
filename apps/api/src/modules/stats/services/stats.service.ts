import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@modules/users/services/users.service';
import { ReportService } from '@modules/reports/services/reports.service';
import { ENUM_USER_STATUS, ENUM_REPORT_STATUS } from '@repo/shared';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { StatsDashboardResponseDto } from '../dtos/response/stats.dashboard.response.dto';

@Injectable()
export class StatsService {
  constructor(
    private readonly helperDateService: HelperDateService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly reportService: ReportService
  ) { }

  async getDashboardStats(): Promise<StatsDashboardResponseDto> {
    const timezone = this.configService.get<string>('app.timezone') || '+07:00';
    const now = this.helperDateService.create();

    // Define exact boundaries for "Last 30 Days"
    // End: End of today
    const endDate = this.helperDateService.endOfDay(now);
    // Start: Start of day, 30 days ago (so we cover a full 30-day window inclusive)
    const startDate = this.helperDateService.startOfDay(
      this.helperDateService.backwardInDays(29, { fromDate: now })
    );

    // Today Start for "Today's Diff" (comparing to end of yesterday)
    const todayStart = this.helperDateService.startOfDay(now);

    // 1. Summary Counts & Diffs
    // Current Totals
    const [totalUsers, activeUsers, totalReports, resolvedReports] = await Promise.all([
      this.usersService.getTotal({}), // Total ever
      this.usersService.getTotal({ status: ENUM_USER_STATUS.ACTIVE }),
      this.reportService.getTotal({}),
      this.reportService.getTotal({ status: ENUM_REPORT_STATUS.RESOLVED })
    ]);

    // Totals at end of yesterday (effectively < todayStart)
    const [usersBeforeToday, reportsBeforeToday] = await Promise.all([
      this.usersService.getTotal({ createdAt: { $lt: todayStart } }),
      this.reportService.getTotal({ createdAt: { $lt: todayStart } })
    ]);

    // Diffs
    const userDiff = totalUsers - usersBeforeToday;
    const reportDiff = totalReports - reportsBeforeToday;

    // 2. Cumulative Charts
    // Base Total: Everything STRICTLY BEFORE the chart window starts
    const [userBaseTotal, reportBaseTotal] = await Promise.all([
      this.usersService.getTotal({ createdAt: { $lt: startDate } }),
      this.reportService.getTotal({ createdAt: { $lt: startDate } })
    ]);

    // Daily Growth (New items per day)
    const [
      userCreated, userDeleted,
      reportCreated, reportDeleted,
      rescuesTrendData, hotspotsData
    ] = await Promise.all([
      this.usersService.getGrowthStats(startDate, endDate, timezone),
      this.usersService.getDeletedStats(startDate, endDate, timezone),
      this.reportService.getGrowthStats(startDate, endDate, timezone),
      this.reportService.getDeletedStats(startDate, endDate, timezone),
      this.reportService.getRescuesByDay(startDate, endDate, timezone),
      this.reportService.getHotspots(5)
    ]);

    // Calculate Cumulative
    const users = this.fillCumulativeDates(userCreated, userDeleted, startDate, endDate, userBaseTotal);
    const reports = this.fillCumulativeDates(reportCreated, reportDeleted, startDate, endDate, reportBaseTotal);

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
        reports,
        rescuesTrend: this.fillDailyData(rescuesTrendData, startDate, endDate),
        hotspots: hotspotsData.map(h => ({ _id: h._id || 'Unknown', count: h.count }))
      }
    };
  }

  private fillCumulativeDates(
    createdData: { _id: string, count: number }[],
    deletedData: { _id: string, count: number }[],
    startDate: Date,
    endDate: Date,
    baseTotal: number
  ) {
    const result = [];
    let currentDate = new Date(startDate); // Start at 00:00 of first day
    const end = new Date(endDate); // End at 23:59 of last day

    const createdMap = new Map(createdData.map(item => [item._id, item.count]));
    const deletedMap = new Map(deletedData.map(item => [item._id, item.count]));

    let currentTotal = baseTotal;

    // Iterate day by day
    while (currentDate <= end) {
      const dateStr = this.helperDateService.format(currentDate, { format: 'yyyy-MM-dd' });
      const dailyCreated = createdMap.get(dateStr) || 0;
      const dailyDeleted = deletedMap.get(dateStr) || 0;

      currentTotal += (dailyCreated - dailyDeleted);

      result.push({
        date: dateStr,
        count: currentTotal
      });

      // Move to next day
      currentDate = this.helperDateService.forwardInDays(1, { fromDate: currentDate });
    }
    return result;
  }

  private fillDailyData(
    data: { _id: string, count: number }[],
    startDate: Date,
    endDate: Date,
  ) {
    const result = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const dataMap = new Map(data.map(item => [item._id, item.count]));

    while (currentDate <= end) {
      const dateStr = this.helperDateService.format(currentDate, { format: 'yyyy-MM-dd' });
      result.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0
      });
      currentDate = this.helperDateService.forwardInDays(1, { fromDate: currentDate });
    }
    return result;
  }
}
