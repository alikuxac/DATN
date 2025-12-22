import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, Query } from '@nestjs/common';
import { ReportService } from '../services/reports.service';
import { ReportCreateRequestDto } from '../dtos/request/report.create.request.dto';
import { AuthJwtAccessProtected, AuthJwtPayload } from '@modules/auth/decorators/auth.jwt.decorator'; // Hoặc decorator tương ứng của bạn
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { Response } from '@common/response/decorators/response.decorator';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { IReportDocument } from '../interfaces/report.interface';
import { ReportUpdateRequestDto } from '../dtos/request/report.update.request.dto';
import { ENUM_REPORT_STATUS, ENUM_STATUS_CODE_ERROR, ENUM_USER_ROLE } from '@repo/shared';
import { DatabaseService } from '@common/database/services/database.service';
import { ClientSession } from 'mongoose';
@Controller({
  version: '1',
  path: '/report',
})
export class ReportUserController {
  constructor(
    private readonly reportService: ReportService,
    private readonly databaseService: DatabaseService
  ) { }

  @Post('/')
  @AuthJwtAccessProtected()
  @Response('report.create')
  async create(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Body() body: ReportCreateRequestDto
  ) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      if (user.role !== ENUM_USER_ROLE.USER) {
        return this.reportService.createByUser(user._id.toString(), body);
      }

      if (user.isVolunteer) {
        throw new BadRequestException('report.error.cannotCreate')
      }

      const checkLastReport = await this.reportService.checkLastReport(user._id.toString(), body.coordinates[1], body.coordinates[0]);

      if (checkLastReport) {
        throw new BadRequestException('report.error.tooClose');
      }

      await this.reportService.createByUser(user._id.toString(), body, { session});

      await this.databaseService.commitTransaction(session);
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }

  }

  @Post(':id')
  @AuthJwtAccessProtected()
  @Response('report.update')
  async update(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Param('id') id: string,
    @Body() body: ReportUpdateRequestDto
  ) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.findOneById(id);
      if (!report) {
        throw new BadRequestException('report.error.notFound');
      }

      if (user.role !== ENUM_USER_ROLE.USER) {
        const result = await this.reportService.updateByUser(user, report._id.toString(), body, { session });
        await this.databaseService.commitTransaction(session);
        return result;
      }

      if (report.by.toString() !== user._id.toString()) {
        throw new BadRequestException('report.error.cannotUpOther');
      }

      if (user.isVolunteer) {
        throw new BadRequestException('report.error.cannotUp')
      }

      if (report.status !== ENUM_REPORT_STATUS.PENDING) {
        throw new BadRequestException('report.error.alreadyProcessed')
      }

      const result = await this.reportService.updateByUser(user, report._id.toString(), body, { session });
      await this.databaseService.commitTransaction(session);
      return result;
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }
  }

  @Delete(':id')
  @AuthJwtAccessProtected()
  @Response('report.delete')
  async delete(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    if (user.role !== ENUM_USER_ROLE.USER) {
      return this.reportService.delete(id);
    }

    const report = await this.reportService.findOneById(id);
    if (!report) {
      throw new BadRequestException('report.error.notFound');
    }

    if (report.by.toString() !== user._id.toString()) {
      throw new BadRequestException('report.error.cannotDelOther');
    }

    return this.reportService.delete(id);
  }

  @Post(':id/accept')
  @AuthJwtAccessProtected()
  @Response('report.accept')
  async accept(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.acceptReport(id, user._id.toString(), { session });

      if (!report) {
        throw new BadRequestException('report.error.alreadyAccepted');
      }

      // --- BẮN NOTIFICATION Ở ĐÂY ---
      // 1. Bắn cho chủ report (report.user): "Rescuer đang tới!"
      // 2. Bắn cho các Rescuer khác xung quanh: "Ẩn report này đi" (Optional)
      await this.databaseService.commitTransaction(session);
      return { data: report };
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }

  }

  @Post(':id/reject')
  @AuthJwtAccessProtected()
  @Response('report.reject')
  async reject(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.findOneById(id);
      if (!report) {
        throw new BadRequestException('report.error.notFound');
      }

      await this.reportService.rejectReport(report, { session });

      await this.databaseService.commitTransaction(session);
    } catch (err) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }

  }

  @Get('/bounds')
  @AuthJwtAccessProtected()
  @Response('report.bounds')
  async bounds(
    @Query('minLat') minLat: number,
    @Query('maxLat') maxLat: number,
    @Query('minLng') minLng: number,
    @Query('maxLng') maxLng: number,
    @Query('limit') limit: number,
  ) {
    const reportList: IReportDocument[] = await this.reportService.findInBounds(
      Number(minLat), Number(maxLat), Number(minLng), Number(maxLng),
      { join: true, paging: { limit, offset: 0 } }
    );

    const mapList = this.reportService.mapList(reportList);

    return {
      data: mapList
    }
  }
}