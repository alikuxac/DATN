import { IAuthLoginResponse } from "@repo/shared";

export class AuthLoginResponseDto implements IAuthLoginResponse {
    tokenType: string;
    expiresIn: number;
    accessToken: string;
    refreshToken: string;
}
