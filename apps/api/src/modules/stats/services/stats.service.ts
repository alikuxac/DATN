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
    // 1. Summary Counts
    const [totalUsers, activeUsers, totalReports, resolvedReports] = await Promise.all([
      usersService.getTotal({}),
      usersService.getTotal({ status: ENUM_USER_STATUS.ACTIVE }),
      reportService.getTotal({}),
      reportService.getTotal({ status: ENUM_REPORT_STATUS.RESOLVED })
    ]);

    // 2. Charts Data (Last 30 days)
    const dateNow = this.helperDateService.create();
    const date30DaysAgo = this.helperDateService.backwardInDays(30);

    const [userChart, reportChart] = await Promise.all([
      usersService.getGrowthStats(date30DaysAgo, dateNow),
      reportService.getGrowthStats(date30DaysAgo, dateNow)
    ]);

    // Fill missing dates
    const users = this.fillMissingDates(userChart, date30DaysAgo, dateNow);
    const reports = this.fillMissingDates(reportChart, date30DaysAgo, dateNow);

    return {
      users: {
        total: totalUsers,
        active: activeUsers
      },
      reports: {
        total: totalReports,
        resolved: resolvedReports
      },
      charts: {
        users,
        reports
      }
    };
  }

  private fillMissingDates(data: { _id: string, count: number }[], startDate: Date, endDate: Date) {
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
