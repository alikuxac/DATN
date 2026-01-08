import { Module } from '@nestjs/common';

import { UsersModule } from '@modules/users/users.module';
import { UserSystemController } from '@modules/users/controllers/user.system.controller';

@Module({
  imports: [UsersModule],
  controllers: [UserSystemController],
})
export class RouterSystemModule { }
