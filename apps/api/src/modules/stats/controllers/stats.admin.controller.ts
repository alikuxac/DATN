import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatsService } from '../services/stats.service';
import { StatsDashboardResponseDto } from '../dtos/response/stats.dashboard.response.dto';
import { AuthJwtAccessProtected } from '@modules/auth/decorators/auth.jwt.decorator';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';

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
  @UserProtected()
  @AuthJwtAccessProtected()
  @Get('/dashboard')
  async getDashboardStats(): Promise<IResponse<StatsDashboardResponseDto>> {
    const stats = await this.statsService.getDashboardStats();
    return {
      data: stats
    };
  }
}
