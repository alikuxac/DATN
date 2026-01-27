import { ENUM_REPORT_SEVERITY, ENUM_REPORT_TYPE, ENUM_REPORT_SOURCE } from "../enums";
import { IDatabaseDto } from "./database.interface";
import { IUserShortResponse } from "./user.interface";

export interface IReportCreateRequest {
  coordinates: number[];
  notes?: string;
  severity?: ENUM_REPORT_SEVERITY;
  peopleCount?: number;
  isPublic?: boolean;
  type: ENUM_REPORT_TYPE;
  images?: string[];
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
  coordinates: number[];
  notes: string;
  severity: ENUM_REPORT_SEVERITY;
  type: ENUM_REPORT_TYPE;
  status: string;
  peopleCount: number;
  isPublic: boolean;
  rescuer?: string | IUserShortResponse;
  images: string[];
  acceptedAt?: Date | string;
  resolvedAt?: Date | string;
  source: ENUM_REPORT_SOURCE;
  isVerified: boolean;
  deviceId?: string;
  isProxyReport: boolean;
  proxyData?: {
    victimName: string;
    victimCount: number;
    victimNote: string;
  };
}