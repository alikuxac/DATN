import { Body, Controller, Post } from '@nestjs/common';
import { ReportService } from '../services/reports.service';
import { ReportCreateRequestDto } from '../dtos/request/report.create.request.dto';
import { AuthJwtAccessProtected, AuthJwtPayload } from '@modules/auth/decorators/auth.jwt.decorator'; // Hoặc decorator tương ứng của bạn
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { Response } from '@common/response/decorators/response.decorator';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
@Controller({
  version: '1',
  path: '/report',
})
export class ReportUserController {
  constructor(private readonly reportService: ReportService) { }

  @Post('/')
  @AuthJwtAccessProtected()
  @Response('report.create')
  async create(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Body() body: ReportCreateRequestDto
  ) {
    return this.reportService.createByUser(user._id.toString(), body);
  }
}