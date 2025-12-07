import { ENUM_AUTH_LOGIN_FROM, ENUM_AUTH_TOKEN_TYPE } from '@modules/auth/enums/auth.enum';

export interface IAuthPassword {
    salt: string;
    passwordHash: string;
    passwordExpired: Date;
    passwordCreated: Date;
}

export interface IAuthPasswordOptions {
    temporary: boolean;
}

export interface IAuthJwtVerificationPayload {
    email: boolean;
    mobileNumber: boolean;
}

export interface IAuthJwtAccessTokenPayload {
    loginDate: Date;
    loginFrom: ENUM_AUTH_LOGIN_FROM;
    user: string;
    email: string;
    session: string;
    role: string;
    iat?: number;
    nbf?: number;
    exp?: number;
    aud?: string;
    iss?: string;
    sub?: string;
}

export type IAuthJwtRefreshTokenPayload = Omit<
    IAuthJwtAccessTokenPayload,
    'role' | 'type' | 'email' | 'verification' | 'termPolicy'
>;

export interface IAuthSocialGooglePayload
    extends Pick<IAuthJwtAccessTokenPayload, 'email'> {
    name: string;
    photo: string;
    emailVerified: boolean;
}


export interface IAuthJwtPreAuthTokenPayload {
    user: string;
    email: string;
    type: ENUM_AUTH_TOKEN_TYPE; // BẮT BUỘC: Để phân biệt

    loginDate: Date;
    loginFrom: ENUM_AUTH_LOGIN_FROM;

    // Các trường tiêu chuẩn JWT
    iat?: number;
    nbf?: number;
    exp?: number;
    aud?: string;
    iss?: string;
    sub?: string;
}