import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
