import { Module } from '@nestjs/common';

import { UsersService } from './services/users.service';

import { UserRepositoryModule } from './repository/user.repository.module';

@Module({
  imports: [UserRepositoryModule],
  providers: [UsersService],
  exports: [UsersService, UserRepositoryModule]
})
export class UsersModule {}
