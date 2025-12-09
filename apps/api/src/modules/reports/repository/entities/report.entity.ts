import { 
  DatabaseEntity, 
  DatabaseProp, 
  DatabaseSchema 
} from "@common/database/decorators/database.decorator";
import { DatabaseObjectIdEntityBase } from "@common/database/bases/database.object-id.entity";
import { 
  ENUM_REPORT_STATUS,
  ENUM_REPORT_LOCATION_TYPE,
  ENUM_REPORT_SEVERITY
} from "@repo/shared";
import { IDatabaseDocument } from "@common/database/interfaces/database.interface";
import { UserEntity } from "@modules/users/repository/entities/user.entity";

export const REPORT_ENTITY_NAME = 'Reports';

@DatabaseEntity({ _id: false, timestamps: false })
export class ReportLocation {
  @DatabaseProp({
    type: String,
    enum: ENUM_REPORT_LOCATION_TYPE,
    default: ENUM_REPORT_LOCATION_TYPE.POINT,
    required: true,
  })
  type: string;

  @DatabaseProp({
    type: [Number], // [longitude, latitude]
    required: true,
    index: '2dsphere', // Index cho GeoJSON
  })
  coordinates: number[];
}

@DatabaseEntity({
  collection: REPORT_ENTITY_NAME, 
  timestamps: true, 
  versionKey: false
})
export class ReportEntity extends DatabaseObjectIdEntityBase{
  @DatabaseProp({
    required: true,
    index: true,
    trim: true,
    type: String,
    ref: UserEntity.name
  })
  user: string;

  @DatabaseProp({
    required: true,
    index: true,
    trim: true,
    type: String,
    ref: UserEntity.name
  })
  by: string;

  @DatabaseProp({
    type: ReportLocation,
    required: true,
  })
  location: ReportLocation;

  @DatabaseProp({
    required: true,
    trim: true,
  })
  address: string;

  @DatabaseProp({
    required: false,
    default: '',
    trim: true,
  })
  notes: string;

  @DatabaseProp({
    required: true,
    enum: ENUM_REPORT_SEVERITY,
    default: ENUM_REPORT_SEVERITY.MEDIUM,
  })
  severity: ENUM_REPORT_SEVERITY;

  @DatabaseProp({
    required: true,
    enum: ENUM_REPORT_STATUS,
    default: ENUM_REPORT_STATUS.PENDING,
    index: true,
  })
  status: ENUM_REPORT_STATUS;

  @DatabaseProp({
    required: true,
    default: 1,
    min: 1,
  })
  peopleCount: number;

  @DatabaseProp({
    required: true,
    default: true,
  })
  isPublic: boolean;
}

export const ReportSchema = DatabaseSchema(ReportEntity);
export type ReportDocument = IDatabaseDocument<ReportEntity>;