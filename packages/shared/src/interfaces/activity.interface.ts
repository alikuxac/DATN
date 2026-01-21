import { IDatabaseDto } from './database.interface';
import { IPasswordHistoryCreateByAdminRequest } from './password-history.interface';
import { IUserShortResponse } from './user.interface';
import { ENUM_ACTIVITY_TYPE } from '../enums/activity.enum';

// Request
export interface IActivityCreateRequest {
  type: ENUM_ACTIVITY_TYPE;
  description: string;
  properties?: Record<string, any>;
}

export type IActivityCreateByAdminRequest = Pick<IPasswordHistoryCreateByAdminRequest, 'by'> & IActivityCreateRequest;

export interface IActivityListResponse extends IDatabaseDto {
  user: string;
  type: ENUM_ACTIVITY_TYPE;
  description: string;
  by: IUserShortResponse;
  properties?: Record<string, any>;
}