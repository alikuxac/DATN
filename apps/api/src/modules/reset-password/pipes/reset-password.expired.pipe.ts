import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { ResetPasswordDoc } from '@modules/reset-password/repository/entities/reset-password.entity';
import { ResetPasswordService } from '@modules/reset-password/services/reset-password.service';

@Injectable()
export class ResetPasswordExpiredPipe implements PipeTransform {
    constructor(private readonly resetPasswordService: ResetPasswordService) { }

    async transform(value: ResetPasswordDoc): Promise<ResetPasswordDoc> {
        // Check if token has expired based on expiredDate
        const checkExpired = this.resetPasswordService.checkExpired(
            value.expiredDate
        );
        if (checkExpired) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.RESET_PASSWORD_EXPIRED,
                message: 'resetPassword.error.expired',
            });
        }

        return value;
    }
}
