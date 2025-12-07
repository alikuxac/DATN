import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportEntity, ReportSchema } from './entities/report.entity';
import { ReportRepository } from './repositories/report.repository';
import { DATABASE_CONNECTION_NAME } from '@common/database/constants/database.constant';
@Module({
  providers: [ReportRepository],
  exports: [ReportRepository],
  controllers: [],
  imports: [
    MongooseModule.forFeature([
      {
        name: ReportEntity.name,
        schema: ReportSchema,
      }
    ],
      DATABASE_CONNECTION_NAME
    ),
  ],
})
export class ReportRepositoryModule { }