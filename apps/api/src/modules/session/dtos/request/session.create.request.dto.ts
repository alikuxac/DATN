import { IsNotEmpty, IsUUID } from 'class-validator';

export class SessionCreateRequestDto {
    @IsNotEmpty()
    @IsUUID()
    user: string;
}
