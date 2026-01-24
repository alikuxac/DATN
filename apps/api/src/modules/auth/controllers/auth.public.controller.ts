import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '@modules/auth/services/auth.service';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';
import { AuthLoginResponseDto } from '@modules/auth/dtos/response/auth.login.response.dto';
import { AuthLoginRequestDto } from '@modules/auth/dtos/request/auth.login.request.dto';
import { UsersService } from '@modules/users/services/users.service';
import { AuthSignUpRequestDto } from '@modules/auth/dtos/request/auth.sign-up.request.dto';
import { ClientSession } from 'mongoose';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { Queue } from 'bullmq';
import { PasswordHistoryService } from '@modules/password-history/services/password-history.service';
import { SessionService } from '@modules/session/services/session.service';
import { IRequestApp } from '@common/request/interfaces/request.interface';
// import { ActivityService } from '@modules/activity/services/activity.service';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ActivityCreateEvent } from '@modules/activity/events/activity.create.event';
import { InjectQueue } from '@nestjs/bullmq';
import { VerificationService } from '@modules/verification/services/verification.service';
import { DatabaseService } from '@common/database/services/database.service';
import { MessageService } from '@common/message/services/message.service';
import {
  ENUM_STATUS_CODE_ERROR,
  ENUM_PASSWORD_HISTORY_TYPE,
  ENUM_USER_SIGN_UP_FROM,
  ENUM_USER_STATUS,
  ENUM_SESSION_PLATFORM,
  ENUM_ACTIVITY_TYPE
} from '@repo/shared';
// import {
//   IAuthSocialGooglePayload,
// } from '@modules/auth/interfaces/auth.interface';

@Controller({
  path: '/auth',
})
export class AuthPublicController {
  constructor(
    private readonly databaseService: DatabaseService,
    @InjectQueue(ENUM_WORKER_QUEUES.EMAIL_QUEUE)
    private readonly emailQueue: Queue,
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly passwordHistoryService: PasswordHistoryService,
    private readonly verificationService: VerificationService,
    private readonly sessionService: SessionService,
    // private readonly activityService: ActivityService,
    private readonly eventEmitter: EventEmitter2,
    private readonly messageService: MessageService
  ) { }

  @Response('auth.loginWithCredential')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('/login/credential')

  async loginWithCredential(
    @Body() { email, password }: AuthLoginRequestDto,
    @Req() request: IRequestApp
  ): Promise<IResponse<AuthLoginResponseDto>> {
    let user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
        message: 'user.error.notFound',
      });
    }

    const passwordAttempt: boolean = this.authService.getPasswordAttempt();
    const passwordMaxAttempt: number =
      this.authService.getPasswordMaxAttempt();
    if (passwordAttempt && user.passwordAttempts >= passwordMaxAttempt) {
      throw new ForbiddenException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_PASSWORD_ATTEMPT_MAX,
        message: 'auth.error.passwordAttemptMax',
      });
    }

    const validate: boolean = this.authService.validateUser(
      password,
      user.password
    );
    if (!validate) {
      user = await this.userService.increasePasswordAttempt(user);

      throw new BadRequestException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_PASSWORD_NOT_MATCH,
        message: 'auth.error.passwordNotMatch',
        data: {
          attempt: user.passwordAttempts,
        },
      });
    } else if (user.status !== ENUM_USER_STATUS.ACTIVE) {
      throw new ForbiddenException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_INACTIVE_FORBIDDEN,
        message: 'user.error.inactive',
      });
    }

    // if (user.verification.email !== true) {
    //   throw new ForbiddenException({
    //     statusCode: ENUM_STATUS_CODE_ERROR.USER_EMAIL_NOT_VERIFIED,
    //     message: 'user.error.emailNotVerified',
    //   });
    // }

    await this.userService.resetPasswordAttempt(user);

    // const checkPasswordExpired: boolean =
    //   this.authService.checkPasswordExpired(user.passwordExpiredAt);
    // if (checkPasswordExpired) {
    //   throw new ForbiddenException({
    //     statusCode: ENUM_STATUS_CODE_ERROR.USER_PASSWORD_EXPIRED,
    //     message: 'auth.error.passwordExpired',
    //   });
    // }

    const databaseSession: ClientSession =
      await this.databaseService.createTransaction();

    try {
      const platform: ENUM_SESSION_PLATFORM = request.headers['x-platform'] as ENUM_SESSION_PLATFORM || ENUM_SESSION_PLATFORM.WEB;
      const deviceId: string = request.headers['x-device-id'] as string;
      const deviceName: string = request.headers['x-device-name'] as string;

      const session = await this.sessionService.create(
        request,
        {
          user: user._id.toString(),
          platform,
          deviceId,
          deviceName,
        },
        { session: databaseSession }
      );

      await this.sessionService.setLoginSession(user, session);

      const token = this.authService.createToken(
        user,
        session._id
      );

      await this.databaseService.commitTransaction(databaseSession);

      return {
        data: token,
      };
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(databaseSession);

      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'auth.error.unknown',
        _error: err,
      });
    }
  }

  @Response('auth.signUp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/sign-up')
  async signUp(
    @Body()
    {
      email,
      password: passwordString,
      firstName,
      lastName,
      language,
      theme,
    }: AuthSignUpRequestDto,
  ): Promise<void> {
    const promises: Promise<any>[] = [
      this.userService.existByEmail(email),
    ];

    const [emailExist] = await Promise.all(promises);

    if (emailExist) {
      throw new ConflictException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_EMAIL_EXIST,
        message: 'user.error.emailExist',
      });
    }

    const password = this.authService.createPassword(passwordString);

    const session: ClientSession =
      await this.databaseService.createTransaction();

    try {
      const user = await this.userService.signUp(
        password,
        {
          email,
          lastName,
          firstName,
        },
        language,
        theme,
        ENUM_USER_SIGN_UP_FROM.PUBLIC,
        { session }
      );

      // const verification =
      //   await this.verificationService.createEmailByUser(user, {
      //     session,
      //   });

      await this.passwordHistoryService.createByUser(
        user,
        {
          type: ENUM_PASSWORD_HISTORY_TYPE.SIGN_UP,
        },
        { session }
      );

      this.eventEmitter.emit(
        'activity.create',
        new ActivityCreateEvent({
          user,
          description: this.messageService.setMessage('activity.user.create'),
          type: ENUM_ACTIVITY_TYPE.USER_CREATE,
          session,
        })
      );

      await Promise.all([
        this.emailQueue.add(
          ENUM_SEND_EMAIL_PROCESS.WELCOME,
          {
            send: { email, name: user.firstName, lang: language },
          },
          {
            debounce: {
              id: `${ENUM_SEND_EMAIL_PROCESS.WELCOME}-${user._id}`,
              ttl: 1000,
            },
          }
        ),
        // this.emailQueue.add(
        //   ENUM_SEND_EMAIL_PROCESS.VERIFICATION,
        //   {
        //     send: { email, name: user.firstName },
        //     data: {
        //       otp: verification.otp,
        //       expiredAt: verification.expiredDate,
        //       reference: verification.reference,
        //     },
        //   },
        //   {
        //     debounce: {
        //       id: `${ENUM_SEND_EMAIL_PROCESS.VERIFICATION}-${user._id}`,
        //       ttl: 1000,
        //     },
        //   }
        // ),
      ]);

      await this.databaseService.commitTransaction(session);
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);

      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'auth.error.unknown',
        _error: err,
      });
    }

    return;
  }
}
