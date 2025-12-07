import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { ResetPasswordDoc } from '@modules/reset-password/repository/entities/reset-password.entity';
import { ResetPasswordService } from '@modules/reset-password/services/reset-password.service';

@Injectable()
export class ResetPasswordParseByTokenPipe implements PipeTransform {
    constructor(private readonly resetPasswordService: ResetPasswordService) {}

    async transform(value: string): Promise<ResetPasswordDoc> {
        const resetPassword: ResetPasswordDoc =
            await this.resetPasswordService.findOneByToken(value);
        if (!resetPassword) {
            throw new NotFoundException({
                statusCode: 5009,
                message: 'resetPassword.error.notFound',
            });
        }

        return resetPassword;
    }
}
