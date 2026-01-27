import { Module } from '@nestjs/common';
import { ShelterService } from './services/shelter.service';
import { ShelterRepositoryModule } from './repository/shelter.repository.module';

@Module({
  imports: [ShelterRepositoryModule],
  providers: [ShelterService],
  exports: [ShelterService, ShelterRepositoryModule],
  controllers: [],
})
export class ShelterModule { }
