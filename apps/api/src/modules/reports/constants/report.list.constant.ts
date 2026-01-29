import {
  ENUM_REPORT_SEVERITY,
  ENUM_REPORT_STATUS,
  ENUM_REPORT_TYPE,
  ENUM_REPORT_SOURCE,
} from '@repo/shared';

export const REPORT_DEFAULT_SEVERITY = Object.values(ENUM_REPORT_SEVERITY);
export const REPORT_DEFAULT_STATUS = Object.values(ENUM_REPORT_STATUS);
export const REPORT_DEFAULT_TYPE = Object.values(ENUM_REPORT_TYPE);
export const REPORT_DEFAULT_SOURCE = Object.values(ENUM_REPORT_SOURCE);

export const REPORT_DEFAULT_AVAILABLE_SEARCH = [
  'q',
  'address',
  'notes',
  'regionId',
  'user.fullName',
  'user.mobileNumber',
];
export const REPORT_DEFAULT_AVAILABLE_ORDER_BY = [
  'createdAt',
  'status',
  'peopleCount',
  'updatedAt',
];
