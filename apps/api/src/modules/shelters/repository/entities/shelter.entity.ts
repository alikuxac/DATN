import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from '@common/database/decorators/database.decorator';
import { DatabaseObjectIdEntityBase } from '@common/database/bases/database.object-id.entity';
import { IDatabaseDocument } from '@common/database/interfaces/database.interface';
import { UserEntity } from '@modules/users/repository/entities/user.entity';
import { Schema } from 'mongoose';

import { ENUM_SHELTER_STATUS, ENUM_SHELTER_TYPE, IShelterResource } from '@repo/shared';

export const SHELTER_ENTITY_NAME = 'Shelters';

@DatabaseEntity({ _id: false, timestamps: false })
export class ShelterLocation {
  @DatabaseProp({
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true,
  })
  type: string;

  @DatabaseProp({
    type: [Number],
    required: true,
  })
  coordinates: number[];
}

@DatabaseEntity({
  collection: SHELTER_ENTITY_NAME,
  timestamps: true,
  versionKey: false
})
export class ShelterEntity extends DatabaseObjectIdEntityBase {
  @DatabaseProp({
    required: true,
    trim: true,
    index: true,
    type: String,
  })
  name: string;

  @DatabaseProp({
    required: true,
    enum: ENUM_SHELTER_TYPE,
    index: true,
    type: String,
  })
  type: ENUM_SHELTER_TYPE;

  @DatabaseProp({
    required: true,
    enum: ENUM_SHELTER_STATUS,
    default: ENUM_SHELTER_STATUS.ACTIVE,
    index: true,
    type: String,
  })
  status: ENUM_SHELTER_STATUS;

  @DatabaseProp({
    type: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    _id: false,
  })
  location: ShelterLocation;

  @DatabaseProp({
    required: true,
    trim: true,
    type: String,
  })
  address: string;

  @DatabaseProp({
    required: true,
    trim: true,
    index: true,
    type: String,
  })
  regionId: string;

  @DatabaseProp({
    required: false,
    type: Number,
    default: 0,
  })
  capacity?: number;

  @DatabaseProp({
    required: false,
    type: Number,
    default: 0,
  })
  currentOccupancy?: number;

  @DatabaseProp({
    required: false,
    type: Array,
    default: [],
  })
  resources?: IShelterResource[];

  @DatabaseProp({
    required: false,
    trim: true,
    type: String,
  })
  contactPerson?: string;

  @DatabaseProp({
    required: false,
    trim: true,
    type: String,
  })
  contactPhone?: string;

  @DatabaseProp({
    required: false,
    trim: true,
    type: String,
  })
  description?: string;

  @DatabaseProp({
    required: false,
    type: Array,
    default: [],
  })
  images?: string[];

  @DatabaseProp({
    required: false,
    type: Object,
  })
  facilities?: {
    electricity?: boolean;
    water?: boolean;
    medical?: boolean;
    kitchen?: boolean;
    restroom?: boolean;
    [key: string]: any;
  };
}

export const ShelterSchema = DatabaseSchema(ShelterEntity);
ShelterSchema.index({ location: '2dsphere' });
export type ShelterDocument = IDatabaseDocument<ShelterEntity>;
