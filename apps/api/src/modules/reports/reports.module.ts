import { Module } from '@nestjs/common';

import { ReportService } from './services/reports.service';
import { ReportRepositoryModule } from './repository/report.repository.module';

@Module({
  imports: [ReportRepositoryModule],
  providers: [ReportService],
  exports: [ReportService, ReportRepositoryModule],
})
export class ReportsModule {}
