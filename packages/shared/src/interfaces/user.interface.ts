import { ENUM_MESSAGE_LANGUAGE, ENUM_USER_GENDER, ENUM_USER_ROLE, ENUM_USER_SIGN_UP_FROM, ENUM_USER_STATUS, ENUM_USER_THEME } from "../enums";
import { IDatabaseDto } from "./database.interface";

// Request
export interface IUserCreateRequest {
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  gender: ENUM_USER_GENDER;
  mobileNumber: string;
}

export type IUserUpdateRequest = Partial<IUserCreateRequest>;

export interface IUserUpdateProfileRequest {
  lastName?: string;
  firstName?: string;
  gender?: ENUM_USER_GENDER;
  avatar?: string;
}


export interface IUserUpdatePasswordAttemptRequest {
  passwordAttempts: number;
}

// Response
export interface IUserVerificationResponse {
  email: boolean;
  emailVerifiedDate?: Date;
  mobileNumber: boolean;
  mobileNumberVerifiedDate?: Date;
}

export interface IUserPreferencesResponse {
  language: ENUM_MESSAGE_LANGUAGE;
  theme: ENUM_USER_THEME;
}

export interface IUserSettingsResponse {
  pushEnabled: boolean;
  sosAlerts: boolean;
  activityUpdates: boolean;
  newsLetters: boolean;
}

export interface IUserGetResponse extends IDatabaseDto {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: ENUM_USER_ROLE;
  isRescueMode: boolean;

  location?: { type: string; coordinates: number[] };
  lastLocationAt?: Date;

  password: string;
  passwordExpiredAt: Date;
  passwordCreatedAt: Date;
  passwordAttempts: number;

  signUpDate: Date;
  signUpFrom: ENUM_USER_SIGN_UP_FROM;
  status: ENUM_USER_STATUS;
  gender: ENUM_USER_GENDER;

  verification: IUserVerificationResponse;
  preferences: IUserPreferencesResponse;
  settings: IUserSettingsResponse;

  avatar?: string;
}


export type IUserListResponse =
  Omit<
    IUserGetResponse,
    'password' | 'passwordExpiredAt' | 'passwordCreatedAt' | 'signUpDate' | 'signUpFrom' | 'gender' | 'verification'
  >;

export type IUserProfileReponse = Omit<IUserGetResponse, 'password' | 'passwordExpiredAt' | 'passwordCreatedAt'>;

export type IUserShortResponse = Omit<IUserListResponse, 'status' | 'createdAt' | 'updatedAt'> & {
  status: ENUM_USER_STATUS;
};