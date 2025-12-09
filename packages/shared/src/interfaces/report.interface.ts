import { ENUM_REPORT_SEVERITY } from "../enums";
import { IDatabaseDto } from "./database.interface";
import { IUserShortResponse } from "./user.interface";

export interface IReportCreateRequest {
  coordinates: number[];
  address: string;
  notes?: string;
  severity?: ENUM_REPORT_SEVERITY;
  peopleCount?: number;
  isPublic?: boolean;
}

export interface IReportCreateByAdminRequest extends IReportCreateRequest {
  userId: string;
}

export interface IReportListResponse extends IDatabaseDto {
  user: IUserShortResponse;
  by: IUserShortResponse;
  location: {
    type: string;
    coordinates: number[];
  };
  type: string;
  coordinates: number[];
  address: string;
  notes: string;
  severity: ENUM_REPORT_SEVERITY;
  status: string;
  peopleCount: number;
  isPublic: boolean;
}