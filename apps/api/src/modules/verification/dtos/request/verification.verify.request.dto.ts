import { ResetPasswordVerifyRequestDto } from '@modules/reset-password/dtos/request/reset-password.verify.request.dto';
import { IVerificationVerifyRequest } from '@repo/shared';

export class VerificationVerifyRequestDto extends ResetPasswordVerifyRequestDto implements IVerificationVerifyRequest {}
