import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { UsersModule } from '@modules/users/users.module';
import { NotificationService } from './notification.service';
import { NotificationRepositoryModule } from './repository/notification.repository.module';
import { AuthModule } from '@modules/auth/auth.module';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    UsersModule,
    NotificationRepositoryModule,
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule { }