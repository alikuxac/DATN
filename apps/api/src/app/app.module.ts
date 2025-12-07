import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { CommonModule } from '../common/common.module';
import { RoutersModule } from '../routers/routers.module';
import { WorkerModule } from '@workers/worker.module';
import { AppMiddlewareModule } from './app.middleware.module';

@Module({
  imports: [CommonModule,
    AppMiddlewareModule,
    RoutersModule, WorkerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
