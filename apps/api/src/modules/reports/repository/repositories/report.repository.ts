import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseObjectIdRepositoryBase } from '@common/database/bases/database.object-id.repository';
import { ReportDocument, ReportEntity } from '@modules/reports/repository/entities/report.entity';
import { UserEntity } from '@modules/users/repository/entities/user.entity';
import { InjectDatabaseModel } from '@common/database/decorators/database.decorator';
@Injectable()
export class ReportRepository extends DatabaseObjectIdRepositoryBase<
  ReportEntity,
  ReportDocument
> {
  constructor(
    @InjectDatabaseModel(ReportEntity.name)
    private readonly reportModel: Model<ReportEntity>
  ) {
    super(reportModel, [
      {
        path: 'user',
        localField: 'user',
        foreignField: '_id',
        model: UserEntity.name,
        justOne: true,
      },
      {
        path: 'by',
        localField: 'by',
        foreignField: '_id',
        model: UserEntity.name,
        justOne: true,
      },
    ]);
  }
}