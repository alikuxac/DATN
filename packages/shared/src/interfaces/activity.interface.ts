import { IDatabaseDto } from './database.interface';
import { IPasswordHistoryCreateByAdminRequest } from './password-history.interface';
import { IUserShortResponse } from './user.interface';

// Request
export interface IActivityCreateRequest {
  description: string;
}

export type IActivityCreateByAdminRequest = Pick<IPasswordHistoryCreateByAdminRequest, 'by'> & IActivityCreateRequest;

export interface IActivityListResponse extends IDatabaseDto {
  user: string;
  description: string;
  by: IUserShortResponse;
}