// Re-export types from @repo/shared for convenience
export type {
  IResponse as ApiResponse,
  IResponsePaging as ApiPagingResponse,
  IResponseMetadata as ApiResponseMetadata,
} from '@repo/shared';

export type {
  IAuthLoginResponse as LoginResponse,
  ISignUpPayload as SignUpPayload,
  ILoginPayload as LoginPayload,
} from '@repo/shared';

export type {
  IUserProfileReponse as UserProfileResponse,
  IUserGetResponse as User,
  IUserListResponse as UserListResponse,
  IUserShortResponse as UserShortResponse,
} from '@repo/shared';

export type {
  IReportListResponse as Report,
  IReportCreateRequest as ReportCreateRequest,
} from '@repo/shared';

export {
  ENUM_USER_ROLE as UserRole,
  ENUM_USER_STATUS as UserStatus,
  ENUM_USER_GENDER as UserGender,
  ENUM_USER_THEME as UserTheme,
} from '@repo/shared';

export {
  ENUM_REPORT_STATUS as ReportStatus,
  ENUM_REPORT_SEVERITY as ReportSeverity,
  ENUM_REPORT_TYPE as ReportType,
} from '@repo/shared';

