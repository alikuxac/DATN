import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { DatabaseObjectIdRepositoryBase } from "@common/database/bases/database.object-id.repository";
import { InjectDatabaseModel } from "@common/database/decorators/database.decorator";
import { 
  UserEntity, 
  UserDocument 
} from "@modules/users/repository/entities/user.entity";

@Injectable()
export class UserRepository extends DatabaseObjectIdRepositoryBase<
  UserEntity,
  UserDocument
> {
  constructor(
    @InjectDatabaseModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>
  ) {
    super(userModel);
  }
}