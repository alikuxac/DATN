import { IntersectionType, PickType } from '@nestjs/swagger';
import { ActivityCreateResponse } from '@modules/activity/dtos/request/activity.create.response.dto';
import { PasswordHistoryCreateByAdminRequestDto } from '@modules/password-history/dtos/request/password-history.create-by-admin.request.dto';
import { IActivityCreateByAdminRequest } from '@repo/shared';

export class ActivityCreateByAdminResponse extends IntersectionType(
    PickType(PasswordHistoryCreateByAdminRequestDto, ['by'] as const),
    ActivityCreateResponse
) implements IActivityCreateByAdminRequest {}
