import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Put,
} from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ENUM_APP_STATUS_CODE_ERROR } from '@app/enums/app.status-code.enum';
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
    ) {}

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
        {  ...body }: UserUpdateProfileRequestDto
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
                statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }

        return;
    }
}
