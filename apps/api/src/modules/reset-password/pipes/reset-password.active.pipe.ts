import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { ResetPasswordDoc } from '@modules/reset-password/repository/entities/reset-password.entity';

@Injectable()
export class ResetPasswordActivePipe implements PipeTransform {
    async transform(value: ResetPasswordDoc): Promise<ResetPasswordDoc> {
        if (value.isReset) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.RESET_PASSWORD_INACTIVE,
                message: 'resetPassword.error.inactive',
            });
        }

        return value;
    }
}
