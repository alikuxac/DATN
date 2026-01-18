import { Body, Controller, Post, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from '../services/reports.service';
import { CreateGuestReportDto } from '../dtos/request/report.create-guest.request.dto';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { Response } from '@common/response/decorators/response.decorator';

@ApiTags('modules.public.report')
@Controller({
  version: '1',
  path: '/report',
})
export class ReportPublicController {
  constructor(private readonly reportService: ReportService) { }

  @Post('/guest')
  @Response('report.createGuest')
  async createGuest(
    @Body() body: CreateGuestReportDto,
    @Headers('x-device-id') deviceId: string
  ) {
    if (!deviceId) {
      throw new HttpException(
        {
          statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
          message: 'report.error.deviceIdRequired',
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Ensure deviceId in DTO matches header if present, or just use header
    body.deviceId = deviceId;

    const canCreate = await this.reportService.checkGuestRateLimit(deviceId);
    if (!canCreate) {
      throw new HttpException(
        {
          statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
          message: 'report.error.rateLimitExceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return this.reportService.createGuest(body);
  }
}
