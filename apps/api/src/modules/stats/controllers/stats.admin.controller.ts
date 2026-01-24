import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatsService } from '../services/stats.service';
import { StatsDashboardResponseDto } from '../dtos/response/stats.dashboard.response.dto';
import { AuthJwtAccessProtected } from '@modules/auth/decorators/auth.jwt.decorator';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';
import { PolicyAbilityProtected } from '@modules/policy/decorators/policy.decorator';
import { ENUM_POLICY_SUBJECT, ENUM_POLICY_ACTION } from '@repo/shared';
import { Throttle } from '@nestjs/throttler';

@ApiTags('modules.admin.stats')
@Controller({
  version: '1',
  path: '/stats',
})
export class StatsAdminController {
  constructor(
    private readonly statsService: StatsService
  ) { }

  @Response('stats.dashboard')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.USER,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('/dashboard')
  async getDashboardStats(): Promise<IResponse<StatsDashboardResponseDto>> {
    const stats = await this.statsService.getDashboardStats();
    return {
      data: stats
    };
  }
}
