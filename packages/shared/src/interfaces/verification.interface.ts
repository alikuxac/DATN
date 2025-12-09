import { IResetPasswordVerifyRequest } from "./password-history.interface";

export type IVerificationVerifyRequest = IResetPasswordVerifyRequest;

export interface IVerificationResponse {
  expiredIn: number;
  to: string;
}