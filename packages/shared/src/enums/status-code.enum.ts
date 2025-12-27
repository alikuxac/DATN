export enum ENUM_STATUS_CODE_ERROR {
  // =======================================================
  // 1. COMMON / SYSTEM / REQUEST (Gốc là 50xx)
  // =======================================================
  APP_UNKNOWN = 50000, // 500 Internal Server Error
  APP_ENV_FORBIDDEN = 50001,

  // Validation thường trả về 422 (Unprocessable Entity)
  REQUEST_VALIDATION = 42200,
  REQUEST_TIMEOUT = 40800, // 408 Request Timeout

  // =======================================================
  // 2. AUTHENTICATION (Gốc là 51xx) -> Map sang 401
  // =======================================================
  AUTH_JWT_ACCESS_TOKEN = 40100,
  AUTH_JWT_REFRESH_TOKEN = 40101,
  AUTH_SOCIAL_GOOGLE_REQUIRED = 40102,
  AUTH_SOCIAL_GOOGLE_INVALID = 40103,

  SESSION_NOT_FOUND = 40110,
  SESSION_EXPIRED = 40111,
  SESSION_FORBIDDEN_REVOKE = 40112,

  // =======================================================
  // 3. AUTHORIZATION / POLICY (Gốc là 52xx) -> Map sang 403
  // =======================================================
  POLICY_ABILITY_FORBIDDEN = 40300,
  POLICY_ROLE_FORBIDDEN = 40301,
  POLICY_ABILITY_PREDEFINED_NOT_FOUND = 40302,
  POLICY_ROLE_PREDEFINED_NOT_FOUND = 40303,

  // =======================================================
  // 4. USER ENTITY (Gốc là 53xx) -> Map lộn xộn (404, 409, 400)
  // =======================================================
  // --- Nhóm Not Found (404) ---
  USER_NOT_FOUND = 40400,
  USER_NOT_SELF = 40000, // Bad Request (Logic sai)

  // --- Nhóm Duplicate/Exist (409 Conflict) ---
  USER_EMAIL_EXIST = 40900,
  USER_USERNAME_EXIST = 40901,
  USER_MOBILE_NUMBER_EXIST = 40902,

  // --- Nhóm Status/Logic Invalid (400 Bad Request) ---
  USER_STATUS_INVALID = 40001,
  USER_BLOCKED_INVALID = 40002,
  USER_INACTIVE_FORBIDDEN = 40310, // Cái này có thể là 403 (Forbidden)
  USER_DELETED_FORBIDDEN = 40311,
  USER_BLOCKED_FORBIDDEN = 40312,

  // --- Nhóm Password/Credential (400 Bad Request) ---
  USER_PASSWORD_NOT_MATCH = 40010,
  USER_PASSWORD_MUST_NEW = 40011,
  USER_PASSWORD_EXPIRED = 40012,
  USER_PASSWORD_ATTEMPT_MAX = 40013,

  // --- Nhóm Validation (400 hoặc 422) ---
  USER_MOBILE_NUMBER_INVALID = 40020,
  USER_USERNAME_NOT_ALLOWED = 40021,
  USER_USERNAME_CONTAIN_BAD_WORD = 40022,
  USER_EMAIL_NOT_VERIFIED = 40023,

  // =======================================================
  // 5. VERIFICATION (Gốc là 54xx)
  // =======================================================
  VERIFICATION_NOT_FOUND = 40401, // 404
  VERIFICATION_EXPIRED = 40030, // 400
  VERIFICATION_VERIFIED = 40031,
  VERIFICATION_OTP_NOT_MATCH = 40032,

  RESET_PASSWORD_NOT_FOUND = 40402, // 404

  RESET_PASSWORD_EXPIRED = 40033,
  RESET_PASSWORD_INACTIVE = 40034,
}