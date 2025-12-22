import { DatabaseProp, DatabaseEntity, DatabaseSchema } from "@common/database/decorators/database.decorator";
import { IDatabaseDocument } from "@common/database/interfaces/database.interface";

@DatabaseEntity({ _id: false, timestamps: false })
export class NotificationSettingsEntity {
  @DatabaseProp({ type: Boolean, default: true }) // Master switch (Tắt hết)
  pushEnabled: boolean;

  @DatabaseProp({ type: Boolean, default: true }) // Chỉ nhận SOS
  sosAlerts: boolean;

  @DatabaseProp({ type: Boolean, default: true }) // Nhận tin cập nhật
  activityUpdates: boolean;

  @DatabaseProp({ type: Boolean, default: true }) // Nhận tin rác/hệ thống
  newsLetters: boolean;
}

export const NotificationSettingsSchema = DatabaseSchema(NotificationSettingsEntity)
export type NotificationSettingsDocument = IDatabaseDocument<NotificationSettingsEntity>;