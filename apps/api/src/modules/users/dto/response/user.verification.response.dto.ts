import { IUserVerificationResponse } from "@repo/shared";

export class UserVerificationResponseDto implements IUserVerificationResponse {
    email: boolean;
    emailVerifiedDate?: Date;
    mobileNumber: boolean;
    mobileNumberVerifiedDate?: Date;
}
