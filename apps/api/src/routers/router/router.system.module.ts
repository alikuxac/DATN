import { Module } from '@nestjs/common';

import { UsersModule } from '@modules/users/users.module';
import { UserSystemController } from '@modules/users/controllers/user.system.controller';
import { ActivityModule } from '@modules/activity/activity.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [UsersModule, ActivityModule, AuthModule],
  controllers: [UserSystemController],
})
export class RouterSystemModule { }
