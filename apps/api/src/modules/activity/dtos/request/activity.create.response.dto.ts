import { IsNotEmpty, IsString } from 'class-validator';

export class ActivityCreateResponse {

    @IsNotEmpty()
    @IsString()
    description: string;
}
