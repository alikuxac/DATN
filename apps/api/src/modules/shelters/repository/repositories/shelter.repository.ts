import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseObjectIdRepositoryBase } from '@common/database/bases/database.object-id.repository';
import { ShelterDocument, ShelterEntity } from '../entities/shelter.entity';
import { UserEntity } from '@modules/users/repository/entities/user.entity';
import { InjectDatabaseModel } from '@common/database/decorators/database.decorator';
import { ENUM_REPORT_LOCATION_TYPE } from '@repo/shared';

@Injectable()
export class ShelterRepository extends DatabaseObjectIdRepositoryBase<
  ShelterEntity,
  ShelterDocument
> {
  constructor(
    @InjectDatabaseModel(ShelterEntity.name)
    private readonly shelterModel: Model<ShelterEntity>
  ) {
    super(shelterModel, [
      {
        path: 'createdBy',
        localField: 'createdBy',
        foreignField: '_id',
        model: UserEntity.name,
        justOne: true,
        select: '_id firstName lastName email'
      }
    ]);
  }

  async findNearby(
    lat: number,
    lng: number,
    maxDistance: number = 10000,
    filters?: Record<string, any>
  ): Promise<ShelterDocument[]> {
    const query: any = {
      location: {
        $near: {
          $geometry: {
            type: ENUM_REPORT_LOCATION_TYPE.POINT,
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      },
      deletedAt: null,
      ...filters
    };

    return this.shelterModel.find(query).exec();
  }
}
