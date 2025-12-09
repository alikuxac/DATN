export enum ENUM_STATUS_CODE_ERROR {
  // -------------------------------------------------------
  // 50xx: COMMON / SYSTEM / REQUEST
  // Các lỗi chung của hệ thống hoặc input đầu vào
  // -------------------------------------------------------
  APP_UNKNOWN = 5000,
  APP_ENV_FORBIDDEN = 5001,
  
  REQUEST_VALIDATION = 5010,
  REQUEST_TIMEOUT = 5011,

  // -------------------------------------------------------
  // 51xx: AUTHENTICATION & SESSION
  // Liên quan đến đăng nhập, token, session (Thường map với 401)
  // -------------------------------------------------------
  AUTH_JWT_ACCESS_TOKEN = 5100,
  AUTH_JWT_REFRESH_TOKEN = 5101,
  AUTH_SOCIAL_GOOGLE_REQUIRED = 5102,
  AUTH_SOCIAL_GOOGLE_INVALID = 5103,

  SESSION_NOT_FOUND = 5120,
  SESSION_EXPIRED = 5121,
  SESSION_FORBIDDEN_REVOKE = 5122,

  // -------------------------------------------------------
  // 52xx: AUTHORIZATION / POLICY
  // Liên quan đến quyền hạn (Thường map với 403)
  // -------------------------------------------------------
  POLICY_ABILITY_FORBIDDEN = 5200,
  POLICY_ROLE_FORBIDDEN = 5201,
  POLICY_ABILITY_PREDEFINED_NOT_FOUND = 5202,
  POLICY_ROLE_PREDEFINED_NOT_FOUND = 5203,

  // -------------------------------------------------------
  // 53xx: USER ENTITY
  // Các lỗi logic liên quan cụ thể đến đối tượng User
  // -------------------------------------------------------
  // Basic
  USER_NOT_FOUND = 5300,
  USER_NOT_SELF = 5301,
  
  // Existence (Duplicate checks)
  USER_EMAIL_EXIST = 5310,
  USER_USERNAME_EXIST = 5311,
  USER_MOBILE_NUMBER_EXIST = 5312,
  
  // Status / State
  USER_STATUS_INVALID = 5320,
  USER_BLOCKED_INVALID = 5321,
  USER_INACTIVE_FORBIDDEN = 5322,
  USER_DELETED_FORBIDDEN = 5323,
  USER_BLOCKED_FORBIDDEN = 5324,
  
  // Password / Credentials
  USER_PASSWORD_NOT_MATCH = 5330,
  USER_PASSWORD_MUST_NEW = 5331,
  USER_PASSWORD_EXPIRED = 5332,
  USER_PASSWORD_ATTEMPT_MAX = 5333,
  
  // Validation specifics
  USER_MOBILE_NUMBER_INVALID = 5340,
  USER_USERNAME_NOT_ALLOWED = 5341,
  USER_USERNAME_CONTAIN_BAD_WORD = 5342,
  USER_EMAIL_NOT_VERIFIED = 5343,

  // -------------------------------------------------------
  // 54xx: VERIFICATION & FLOWS
  // Các quy trình nghiệp vụ tạm thời (OTP, Reset Password)
  // -------------------------------------------------------
  // Verification (OTP/Email link)
  VERIFICATION_NOT_FOUND = 5400,
  VERIFICATION_EXPIRED = 5401,
  VERIFICATION_VERIFIED = 5402,
  VERIFICATION_OTP_NOT_MATCH = 5403,
  VERIFICATION_IS_ACTIVE = 5404,
  VERIFICATION_USER_NOT_MATCH = 5405,
  VERIFICATION_MAX_IN_DAY = 5406,

  // Reset Password Flow
  RESET_PASSWORD_NOT_FOUND = 5410,
  RESET_PASSWORD_EXPIRED = 5411,
  RESET_PASSWORD_INVALID = 5412,
  RESET_PASSWORD_FORBIDDEN_REVOKE = 5413,
  RESET_PASSWORD_INACTIVE = 5414,
}