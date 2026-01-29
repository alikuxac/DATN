import {
  DatabaseEntity,
  DatabaseProp,
  DatabaseSchema
} from "@common/database/decorators/database.decorator";
import { DatabaseObjectIdEntityBase } from "@common/database/bases/database.object-id.entity";
import {
  ENUM_REPORT_STATUS,
  ENUM_REPORT_LOCATION_TYPE,
  ENUM_REPORT_SEVERITY,
  ENUM_REPORT_TYPE,
  ENUM_REPORT_SOURCE
} from "@repo/shared";
import { IDatabaseDocument } from "@common/database/interfaces/database.interface";
import { UserEntity } from "@modules/users/repository/entities/user.entity";
import { Schema } from 'mongoose';

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
  })
  coordinates: number[];
}

@DatabaseEntity({
  collection: REPORT_ENTITY_NAME,
  timestamps: true,
  versionKey: false
})
export class ReportEntity extends DatabaseObjectIdEntityBase {
  @DatabaseProp({
    required: false,
    index: true,
    trim: true,
    type: Schema.Types.ObjectId,
    ref: UserEntity.name
  })
  user: string;

  @DatabaseProp({
    required: false,
    index: true,
    trim: true,
    type: Schema.Types.ObjectId,
    ref: UserEntity.name
  })
  by: string;


  @DatabaseProp({
    type: ReportLocation,
    required: true,
  })
  location: ReportLocation;

  @DatabaseProp({
    required: false,
    index: true,
    trim: true,
    type: [Schema.Types.ObjectId],
    ref: UserEntity.name,
  })
  rescuers?: string[];

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

  @DatabaseProp({
    required: true,
    enum: ENUM_REPORT_TYPE,
    index: true,
  })
  type: ENUM_REPORT_TYPE;

  @DatabaseProp({
    required: true,
    trim: true,
    index: true,
  })
  regionId: string;

  @DatabaseProp({
    type: [String],
    default: [],
  })
  images: string[];

  @DatabaseProp({
    required: false,
    type: Date,
  })
  acceptedAt?: Date;

  @DatabaseProp({
    required: false,
    type: Date,
  })
  resolvedAt?: Date;

  @DatabaseProp({
    required: false,
    type: Date,
  })
  rejectedAt?: Date;

  @DatabaseProp({
    required: true,
    enum: ENUM_REPORT_SOURCE,
    default: ENUM_REPORT_SOURCE.APP,
    index: true,
  })
  source: ENUM_REPORT_SOURCE;

  @DatabaseProp({
    required: true,
    default: true,
  })
  isVerified: boolean;

  @DatabaseProp({
    required: false,
    index: true,
    trim: true,
  })
  deviceId?: string;

  @DatabaseProp({
    required: true,
    default: false,
  })
  isProxyReport: boolean;

  @DatabaseProp({
    type: Object, // Or specific schema if needed, keeping it simple as nested object for now or defined class
    required: false,
  })
  proxyData?: {
    victimName: string;
    victimCount: number;
    victimNote: string;
  };

  @DatabaseProp({
    required: false,
    trim: true,
    type: String,
  })
  rejectReason?: string;
}

export const ReportSchema = DatabaseSchema(ReportEntity);
ReportSchema.index({ location: '2dsphere' });
export type ReportDocument = IDatabaseDocument<ReportEntity>;