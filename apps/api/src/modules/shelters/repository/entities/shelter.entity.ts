import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema,
} from '@common/database/decorators/database.decorator';
import { DatabaseObjectIdEntityBase } from '@common/database/bases/database.object-id.entity';
import { IDatabaseDocument } from '@common/database/interfaces/database.interface';

export enum ENUM_SHELTER_STATUS {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FULL = 'FULL',
  CLOSED = 'CLOSED'
}

export enum ENUM_SHELTER_TYPE {
  EVACUATION = 'EVACUATION',
  WAREHOUSE = 'WAREHOUSE',
  MEDICAL = 'MEDICAL',
  TEMPORARY = 'TEMPORARY'
}

export interface ShelterResource {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  lastUpdated?: Date;
}

export const SHELTER_ENTITY_NAME = 'Shelters';

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
  })
  name: string;

  @DatabaseProp({
    required: true,
    enum: ENUM_SHELTER_TYPE,
    index: true,
  })
  type: ENUM_SHELTER_TYPE;

  @DatabaseProp({
    required: true,
    enum: ENUM_SHELTER_STATUS,
    default: ENUM_SHELTER_STATUS.ACTIVE,
    index: true,
  })
  status: ENUM_SHELTER_STATUS;

  @DatabaseProp({
    required: true,
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @DatabaseProp({
    required: true,
    trim: true,
  })
  address: string;

  @DatabaseProp({
    required: true,
    trim: true,
    index: true,
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
  resources?: ShelterResource[];

  @DatabaseProp({
    required: false,
    trim: true,
  })
  contactPerson?: string;

  @DatabaseProp({
    required: false,
    trim: true,
  })
  contactPhone?: string;

  @DatabaseProp({
    required: false,
    trim: true,
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
export type ShelterDocument = IDatabaseDocument<ShelterEntity>;
