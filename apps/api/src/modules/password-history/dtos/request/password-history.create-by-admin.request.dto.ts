import { IsNotEmpty, IsUUID } from 'class-validator';
import { PasswordHistoryCreateRequestDto } from '@modules/password-history/dtos/request/password-history.create.request.dto';
import { IPasswordHistoryCreateByAdminRequest } from '@repo/shared';

export class PasswordHistoryCreateByAdminRequestDto extends PasswordHistoryCreateRequestDto implements IPasswordHistoryCreateByAdminRequest {
    @IsNotEmpty()
    @IsUUID()
    by: string;
}
