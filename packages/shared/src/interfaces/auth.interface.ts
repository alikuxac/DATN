import { ENUM_AUTH_LOGIN_FROM } from '../enums/auth.enum';

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

// Request
export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ISignUpPayload extends ILoginPayload {
  firstName: string;
  lastName: string;
}

// Response
export interface IAuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface IAuthRefreshReponse extends IAuthLoginResponse {}

export interface IAuthChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}