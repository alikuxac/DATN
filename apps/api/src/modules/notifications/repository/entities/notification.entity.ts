import { DatabaseEntity, DatabaseProp, DatabaseSchema } from "@common/database/decorators/database.decorator";
import { DatabaseObjectIdEntityBase } from "@common/database/bases/database.object-id.entity";
import { ENUM_NOTIFICATION_TYPE } from "@repo/shared";
import { IDatabaseDocument } from "@common/database/interfaces/database.interface";
import { UserEntity } from "@modules/users/repository/entities/user.entity"; // Need to check path

export const NOTIFICATION_ENTITY_NAME = 'Notifications';

@DatabaseEntity({
  collection: NOTIFICATION_ENTITY_NAME,
  timestamps: true,
})
export class NotificationEntity extends DatabaseObjectIdEntityBase {
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
    enum: ENUM_NOTIFICATION_TYPE,
    index: true,
  })
  type: ENUM_NOTIFICATION_TYPE;

  @DatabaseProp({
    required: false,
    trim: true,
  })
  title: string;

  @DatabaseProp({
    required: false,
    trim: true,
  })
  body: string;

  @DatabaseProp({
    type: Object,
    required: false,
  })
  data?: Record<string, any>;

  @DatabaseProp({ default: false })
  isRead: boolean;

  @DatabaseProp({ required: false })
  readAt?: Date;
}

export const NotificationSchema = DatabaseSchema(NotificationEntity);
export type NotificationDocument = IDatabaseDocument<NotificationEntity>;
