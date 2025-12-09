import { ENUM_PASSWORD_HISTORY_TYPE } from "../enums";
import { IAuthChangePasswordRequest, ILoginPayload } from "./auth.interface";

export interface IPasswordHistoryCreateRequest {
  type: ENUM_PASSWORD_HISTORY_TYPE
}

export interface IPasswordHistoryCreateByAdminRequest {
  by: string;
}

export type IResetPasswordCreateRequest = Pick<ILoginPayload, 'email'>;

export type IResetPasswordResetRequest = Pick<IAuthChangePasswordRequest, 'newPassword'>;

export interface IResetPasswordVerifyRequest {
  otp: string;
}

export interface IResetPasswordCreteResponse {
  expiredDate: Date;
  to: string;
  token: string;
  url: string;
}