import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Put,
} from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { DatabaseService } from '@common/database/services/database.service';
import { MessageService } from '@common/message/services/message.service';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';
import { ActivityService } from '@modules/activity/services/activity.service';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { IAuthJwtAccessTokenPayload } from '@modules/auth/interfaces/auth.interface';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { UserUpdateProfileRequestDto } from '@modules/users/dto/request/user.update-profile.request.dto';
import { UserProfileResponseDto } from '@modules/users/dto/response/user.profile.response.dto';
import {
    UserParsePipe,
} from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { UsersService } from '@modules/users/services/users.service';
import { UserUpdatePreferencesRequestDto } from '../dto/request/user.update-preferences.request.dto';
import { UserUpdateSettingsDto } from '../dto/request/user.update-settings.request.dto';

@Controller({
    version: '1',
    path: '/user',
})
export class UserSharedController {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly userService: UsersService,
        private readonly activityService: ActivityService,
        private readonly messageService: MessageService
    ) { }

    @Response('user.profile')
    @UserProtected([false])
    @AuthJwtAccessProtected()
    @Get('/profile')
    async profile(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument
    ): Promise<IResponse<UserProfileResponseDto>> {
        const mapped: UserProfileResponseDto =
            this.userService.mapProfile(user);
        return { data: mapped };
    }

    @Response('user.updateProfile')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Put('/profile/update')
    async updateProfile(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument,
        @Body()
        { ...body }: UserUpdateProfileRequestDto
    ): Promise<void> {

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateProfile(
                user,
                { ...body },
                { session }
            );

            await this.activityService.createByUser(
                user,
                {
                    description: this.messageService.setMessage(
                        'activity.user.updateProfile'
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }

        return;
    }

    @Response('user.preferences')
    @UserProtected([false])
    @AuthJwtAccessProtected()
    @Get('/preferences')
    async preferences(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument
    ) {
        return { data: user.preferences };
    }

    @Response('user.updatePreferences')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Put('/preferences/update')
    async updatePreferences(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument,
        @Body()
        { ...body }: UserUpdatePreferencesRequestDto
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updatePreferences(
                user,
                { ...body },
                { session }
            );

            await this.activityService.createByUser(
                user,
                {
                    description: this.messageService.setMessage(
                        'activity.user.updatePreferences'
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }


        return;
    }

    @Response('user.updateLocation')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Put('/location/update')
    async updateLocation(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument,
        @Body()
        { latitude, longitude }: { latitude: number; longitude: number }
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateLocation(user, latitude, longitude, {
                session,
            });

            await this.activityService.createByUser(
                user,
                {
                    description: this.messageService.setMessage(
                        'activity.user.updateLocation'
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);
            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.updatePushToken')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Put('/push-token/update')
    async updatePushToken(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument,
        @Body()
        { pushToken }: { pushToken: string }
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateExpoPushToken(user, pushToken, {
                session,
            });

            await this.databaseService.commitTransaction(session);
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);
            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.updateNotificationSettings')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Put('/settings/notification/update')
    async updateNotificationSettings(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument,
        @Body()
        { pushEnabled, sosAlerts, activityUpdates, newsLetters }: UserUpdateSettingsDto
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateNotificationSettings(user, { pushEnabled, sosAlerts, activityUpdates, newsLetters }, { session });

            await this.databaseService.commitTransaction(session);
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);
            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.updateVolunteerStatus')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Put('/volunteer/update')
    async updateVolunteer(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument,
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateVolunteerStatus(user, {
                session,
            });

            await this.activityService.createByUser(
                user,
                {
                    description: this.messageService.setMessage(
                        'activity.user.updateVolunteer'
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);
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