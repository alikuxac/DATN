import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClientSession } from 'mongoose';
import {
  AuthJwtAccessProtected,
  AuthJwtPayload,
  AuthJwtRefreshProtected,
  AuthJwtToken,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { AuthService } from '@modules/auth/services/auth.service';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';
import { UsersService } from '@modules/users/services/users.service';
import { AuthRefreshResponseDto } from '@modules/auth/dtos/response/auth.refresh.response.dto';
import { AuthChangePasswordRequestDto } from '@modules/auth/dtos/request/auth.change-password.request.dto';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { Queue } from 'bullmq';
import { ENUM_PASSWORD_HISTORY_TYPE, ENUM_STATUS_CODE_ERROR, ENUM_ACTIVITY_TYPE } from '@repo/shared';
import { PasswordHistoryService } from '@modules/password-history/services/password-history.service';
import { SessionService } from '@modules/session/services/session.service';
// import { ActivityService } from '@modules/activity/services/activity.service';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ActivityCreateEvent } from '@modules/activity/events/activity.create.event';
import { MessageService } from '@common/message/services/message.service';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { DatabaseService } from '@common/database/services/database.service';
import {
  IAuthJwtAccessTokenPayload,
  IAuthJwtRefreshTokenPayload,
} from '@modules/auth/interfaces/auth.interface';

@ApiTags('modules.shared.auth')
@Controller({
  version: '1',
  path: '/auth',
})
export class AuthSharedController {
  constructor(
    private readonly databaseService: DatabaseService,
    @InjectQueue(ENUM_WORKER_QUEUES.EMAIL_QUEUE)
    private readonly emailQueue: Queue,
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly passwordHistoryService: PasswordHistoryService,
    private readonly sessionService: SessionService,
    // private readonly activityService: ActivityService,
    private readonly eventEmitter: EventEmitter2,
    private readonly messageService: MessageService
  ) { }

  @Response('auth.refresh')
  @UserProtected()
  @AuthJwtRefreshProtected()
  @HttpCode(HttpStatus.OK)
  @Post('/refresh')
  async refresh(
    @AuthJwtToken() refreshToken: string,
    @AuthJwtPayload<IAuthJwtRefreshTokenPayload>()
    { user: userFromPayload, session }: IAuthJwtRefreshTokenPayload
  ): Promise<IResponse<AuthRefreshResponseDto>> {
    const checkActive = await this.sessionService.findLoginSession(session);
    if (!checkActive) {
      throw new UnauthorizedException({
        statusCode: ENUM_STATUS_CODE_ERROR.SESSION_NOT_FOUND,
        message: 'session.error.notFound',
      });
    }

    const user =
      await this.userService.findOneActiveByEmail(userFromPayload);
    const token = this.authService.refreshToken(user, refreshToken);

    return {
      data: token,
    };
  }

  @Response('auth.changePassword')
  @UserProtected()
  @AuthJwtAccessProtected()
  @Patch('/change-password')
  async changePassword(
    @Body() body: AuthChangePasswordRequestDto,
    @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user')
    userFromPayload: string
  ): Promise<void> {
    let user = await this.userService.findOneById(userFromPayload);

    const passwordAttempt: boolean = this.authService.getPasswordAttempt();
    const passwordMaxAttempt: number =
      this.authService.getPasswordMaxAttempt();
    if (passwordAttempt && user.passwordAttempts >= passwordMaxAttempt) {
      throw new ForbiddenException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_PASSWORD_ATTEMPT_MAX,
        message: 'auth.error.passwordAttemptMax',
      });
    }

    const matchPassword = this.authService.validateUser(
      body.oldPassword,
      user.password
    );
    if (!matchPassword) {
      await this.userService.increasePasswordAttempt(user);

      throw new BadRequestException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_PASSWORD_NOT_MATCH,
        message: 'auth.error.passwordNotMatch',
      });
    }

    await this.userService.resetPasswordAttempt(user);

    const password = this.authService.createPassword(body.newPassword);
    const checkPassword =
      await this.passwordHistoryService.findOneUsedByUser(
        user._id.toString(),
        body.newPassword
      );
    if (checkPassword) {
      const passwordPeriod =
        await this.passwordHistoryService.getPasswordPeriod();
      throw new BadRequestException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_PASSWORD_MUST_NEW,
        message: 'auth.error.passwordMustNew',
        _metadata: {
          customProperty: {
            messageProperties: {
              period: passwordPeriod,
            },
          },
        },
      });
    }

    const session: ClientSession =
      await this.databaseService.createTransaction();

    try {
      user = await this.userService.updatePassword(user, password, {
        session,
      });

      await this.passwordHistoryService.createByUser(
        user,
        {
          type: ENUM_PASSWORD_HISTORY_TYPE.CHANGE,
        },
        { session }
      );
      this.eventEmitter.emit(
        'activity.create',
        new ActivityCreateEvent({
          user,
          description: this.messageService.setMessage(
            'activity.user.changePassword'
          ),
          type: ENUM_ACTIVITY_TYPE.USER_CHANGE_PASSWORD,
          session,
        })
      );
      await this.sessionService.updateManyRevokeByUser(user._id.toString(), {
        session,
      });

      await this.databaseService.commitTransaction(session);

      await this.emailQueue.add(
        ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD,
        {
          send: { email: user.email, name: user.firstName },
        },
        {
          debounce: {
            id: `${ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD}-${user._id}`,
            ttl: 1000,
          },
        }
      );
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);

      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }
  }
}
