import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatsService } from '../services/stats.service';
import { StatsDashboardResponseDto } from '../dtos/response/stats.dashboard.response.dto';
import { AuthJwtAccessProtected } from '@modules/auth/decorators/auth.jwt.decorator';
import { PolicyAbilityProtected } from '@modules/policy/decorators/policy.decorator';
import { ENUM_POLICY_ACTION, ENUM_POLICY_SUBJECT } from '@repo/shared';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { Response } from '@common/response/decorators/response.decorator';
import { UsersService } from '@modules/users/services/users.service';
import { ReportService } from '@modules/reports/services/reports.service';
import { IResponse } from '@common/response/interfaces/response.interface';

@ApiTags('modules.admin.stats')
@Controller({
  version: '1',
  path: '/stats',
})
export class StatsAdminController {
  constructor(
    private readonly statsService: StatsService,
    private readonly usersService: UsersService,
    private readonly reportService: ReportService
  ) { }

  @Response('stats.dashboard')
  @AuthJwtAccessProtected()
  @UserProtected()
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.USER, // Or a dedicated STATS subject if available
    action: [ENUM_POLICY_ACTION.READ],
  })
  @Get('/dashboard')
  async getDashboardStats(): Promise<IResponse<StatsDashboardResponseDto>> {
    const stats = await this.statsService.getDashboardStats(this.usersService, this.reportService);
    return {
      data: stats
    };
  }
}
