import { Module } from '@nestjs/common';
import { StatsService } from './services/stats.service';
import { UsersModule } from '@modules/users/users.module';
import { ReportsModule } from '@modules/reports/reports.module';

@Module({
  imports: [UsersModule, ReportsModule],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule { }
