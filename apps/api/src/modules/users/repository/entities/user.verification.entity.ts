import { DatabaseSchema, DatabaseProp, DatabaseEntity } from "@common/database/decorators/database.decorator";
import { IDatabaseDocument } from "@common/database/interfaces/database.interface";


@DatabaseEntity({ _id: false, timestamps: false })
export class UserVerificationEntity {
  @DatabaseProp({ required: true, index: true, default: false })
  email: boolean;

  @DatabaseProp({ required: false })
  emailVerfiedAt: Date;

  @DatabaseProp({ required: true, index: true, default: false })
  mobileNumber: boolean;

  @DatabaseProp({ required: false })
  mobileNumberVerifiedAt: Date;
}

export const UserVerificationSchema = DatabaseSchema(UserVerificationEntity);
export type UserVerificationDocument = IDatabaseDocument<UserVerificationEntity>;
