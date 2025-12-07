export class AuthLoginResponseDto {
    tokenType: string;
    expiresIn: number;
    accessToken: string;
    refreshToken: string;
}
