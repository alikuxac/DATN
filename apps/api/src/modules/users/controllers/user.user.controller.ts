import {
    // BadRequestException,
    // Body,
    // ConflictException,
    Controller,
    Delete,
    InternalServerErrorException,
    // NotFoundException,
    // Put,
} from '@nestjs/common';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { Response } from '@common/response/decorators/response.decorator';
import { UsersService } from '@modules/users/services/users.service';
// import { ENUM_USER_STATUS_CODE_ERROR } from '@modules/users/enums/user.status-code.enum';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { ClientSession } from 'mongoose';
import { ActivityService } from '@modules/activity/services/activity.service';
import { MessageService } from '@common/message/services/message.service';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { SessionService } from '@modules/session/services/session.service';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { DatabaseService } from '@common/database/services/database.service';

@Controller({
    version: '1',
    path: '/user',
})
export class UserUserController {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly userService: UsersService,
        private readonly activityService: ActivityService,
        private readonly messageService: MessageService,
        private readonly sessionService: SessionService,

    ) {}

    @Response('user.delete')
    @UserProtected([false])
    @AuthJwtAccessProtected()
    @Delete('/delete')
    async delete(
        @AuthJwtPayload('user', UserParsePipe) user: UserDocument
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.softDelete(user, {
                session,
                actionBy: user._id.toString(),
            });

            await this.activityService.createByUser(
                user,
                {
                    description:
                        this.messageService.setMessage('activity.delete'),
                },
                { session }
            );

            await this.sessionService.updateManyRevokeByUser(user._id.toString(), {
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

        return;
    }

    // @Response('user.updateMobileNumber')
    // @UserProtected()
    // @AuthJwtAccessProtected()
    // @Put('/update/mobile-number')
    // async updateMobileNumber(
    //     @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    //     @Body()
    //     { number, country }: UserUpdateMobileNumberRequestDto
    // ): Promise<void> {
    //     const checkValidMobileNumber = this.userService.checkMobileNumber(
    //         number,
    //         country
    //     );
    //     if (!checkValidMobileNumber) {
    //         throw new BadRequestException({
    //             statusCode: ENUM_USER_STATUS_CODE_ERROR.MOBILE_NUMBER_INVALID,
    //             message: 'user.error.mobileNumberInvalid',
    //         });
    //     }

    //     const session: ClientSession =
    //         await this.databaseService.createTransaction();

    //     try {
    //         await this.userService.updateMobileNumber(
    //             user,
    //             { number, country },
    //             { session }
    //         );
    //         await this.activityService.createByUser(
    //             user,
    //             {
    //                 description: this.messageService.setMessage(
    //                     'activity.user.updateMobileNumber'
    //                 ),
    //             },
    //             { session }
    //         );

    //         await this.databaseService.commitTransaction(session);
    //     } catch (err: unknown) {
    //         await this.databaseService.abortTransaction(session);

    //         throw new InternalServerErrorException({
    //             statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
    //             message: 'http.serverError.internalServerError',
    //             _error: err,
    //         });
    //     }

    //     return;
    // }
}
