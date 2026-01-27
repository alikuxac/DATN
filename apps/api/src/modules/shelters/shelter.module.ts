import { Module } from '@nestjs/common';
import { ShelterRepository } from './repository/repositories/shelter.repository';
import { ShelterService } from './services/shelter.service';
import { ShelterAdminController } from './controllers/shelter.admin.controller';
import { ShelterRepositoryModule } from './repository/shelter.repository.module';

@Module({
  imports: [ShelterRepositoryModule],
  providers: [ShelterService],
  exports: [ShelterService, ShelterRepositoryModule],
  controllers: [ShelterAdminController],
})
export class ShelterModule { }
