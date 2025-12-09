import { ENUM_USER_GENDER, ENUM_USER_ROLE, ENUM_USER_SIGN_UP_FROM, ENUM_USER_STATUS } from "../enums";
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

export type IUserUpdateRequest = Omit<IUserCreateRequest, 'email'>

export type IUserUpdateProfileRequest = Pick<IUserCreateRequest, 'lastName' | 'firstName' | 'gender'>

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

export interface IUserGetResponse extends IDatabaseDto {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: ENUM_USER_ROLE;

  password: string;
  passwordExpiredAt: Date;
  passwordCreatedAt: Date;
  passwordAttempts: number;

  signUpDate: Date;
  signUpFrom: ENUM_USER_SIGN_UP_FROM;
  status: ENUM_USER_STATUS;
  gender: ENUM_USER_GENDER;

  verification: IUserVerificationResponse;
}

export type IUserListResponse =
  Omit<
    IUserGetResponse,
    'password' | 'passwordExpiredAt' | 'passwordCreatedAt' | 'signUpDate' | 'signUpFrom' | 'gender' | 'verification'
  >;

export type IUserProfileReponse = Omit<IUserGetResponse, 'role' | 'mobileNumber'>;

export type IUserShortResponse = Omit<IUserListResponse, 'status' | 'createdAt' | 'updatedAt'> & {
  status: ENUM_USER_STATUS;
};