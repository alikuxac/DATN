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
        select: '_id firstName lastName mobileNumber location avatar isRescueMode'
      },
      {
        path: 'by',
        localField: 'by',
        foreignField: '_id',
        model: UserEntity.name,
        justOne: true,
        select: '_id firstName lastName mobileNumber location avatar'
      },
      {
        path: 'rescuers',
        localField: 'rescuers',
        foreignField: '_id',
        model: UserEntity.name,
        justOne: false,
        select: '_id firstName lastName mobileNumber location avatar isRescueMode lastLocationAt' // lastLocationAt needed for map
      }
    ]);
  }

  async getStatistics() {
    return this.reportModel.aggregate([
      {
        $match: {
          status: 'RESOLVED',
          acceptedAt: { $exists: true },
          resolvedAt: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: { $subtract: ["$acceptedAt", "$createdAt"] },
          rescueTime: { $subtract: ["$resolvedAt", "$acceptedAt"] },
          totalTime: { $subtract: ["$resolvedAt", "$createdAt"] }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: "$responseTime" },
          avgRescueTime: { $avg: "$rescueTime" },
          avgTotalTime: { $avg: "$totalTime" },
          count: { $sum: 1 }
        }
      }
    ]);
  }
}