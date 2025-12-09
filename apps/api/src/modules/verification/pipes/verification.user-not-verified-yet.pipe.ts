import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';

@Injectable()
export class VerificationUserEmailNotVerifiedYetPipe implements PipeTransform {
    async transform(value: UserDocument): Promise<UserDocument> {
        if (value.verification.email) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.VERIFICATION_VERIFIED,
                message: 'verification.error.userEmailVerified',
            });
        }

        return value;
    }
}

@Injectable()
export class VerificationUserMobileNumberNotVerifiedYetPipe
    implements PipeTransform
{
    async transform(value: UserDocument): Promise<UserDocument> {
        if (value.verification.mobileNumber) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.VERIFICATION_VERIFIED,
                message: 'verification.error.userMobileNumberVerified',
            });
        }

        return value;
    }
}
