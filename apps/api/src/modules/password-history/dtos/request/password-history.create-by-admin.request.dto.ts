import { IsNotEmpty, IsUUID } from 'class-validator';
import { PasswordHistoryCreateRequestDto } from '@modules/password-history/dtos/request/password-history.create.request.dto';

export class PasswordHistoryCreateByAdminRequestDto extends PasswordHistoryCreateRequestDto {
    @IsNotEmpty()
    @IsUUID()
    by: string;
}
