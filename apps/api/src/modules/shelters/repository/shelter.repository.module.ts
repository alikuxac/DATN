import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from '@common/database/constants/database.constant';
import {
  ShelterEntity,
  ShelterSchema,
} from '@modules/shelters/repository/entities/shelter.entity';
import { ShelterRepository } from '@modules/shelters/repository/repositories/shelter.repository';

@Module({
  providers: [ShelterRepository],
  exports: [ShelterRepository, MongooseModule],
  controllers: [],
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: ShelterEntity.name,
          schema: ShelterSchema,
        },
      ],
      DATABASE_CONNECTION_NAME
    ),
  ],
})
export class ShelterRepositoryModule { }
