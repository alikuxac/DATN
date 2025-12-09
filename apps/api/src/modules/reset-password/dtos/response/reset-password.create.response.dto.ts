import { IResetPasswordCreteResponse } from "@repo/shared";

export class ResetPasswordCreteResponseDto implements IResetPasswordCreteResponse {
    expiredDate: Date;

    to: string;

    token: string;

    url: string;
}
