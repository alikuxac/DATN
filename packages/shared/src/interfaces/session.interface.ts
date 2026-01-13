import { ENUM_SESSION_STATUS, ENUM_SESSION_PLATFORM } from "../enums";
import { IDatabaseDto } from "./database.interface";

export interface ISessionCreateRequest {
  user: string;
  platform: ENUM_SESSION_PLATFORM;
  deviceId?: string;
  deviceName?: string;
}

export interface ISessionListResponse extends IDatabaseDto {
  user: string;

  expiredAt: Date;

  revokeAt?: Date;

  status: ENUM_SESSION_STATUS;

  ip: string;

  hostname: string;

  protocol: string;

  originalUrl: string;

  method: string;

  userAgent?: string;


  xForwardedFor?: string;

  xForwardedHost?: string;

  xForwardedPorto?: string;
}