import { registerAs } from "@nestjs/config";
import ms from 'ms';

/**
 * Convert expiration time to milliseconds
 * Supports both string format ("7d", "1h") and number in seconds (604800)
 */
function parseExpirationTime(value: string | undefined, defaultValue: string): number {
  if (!value || typeof value !== 'string') {
    return ms(defaultValue as ms.StringValue) || 0;
  }

  // If it's a pure number (seconds), convert to ms
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    return numValue * 1000; // seconds to milliseconds
  }

  // Otherwise treat as string duration ("7d", "1h", etc)
  return ms(value as ms.StringValue) || 0;
}

export default registerAs(
  "auth",
  (): Record<string, any> => ({
    jwt: {
      secret: process.env.JWT_SECRET,
      prefix: 'Bearer',
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
      jwksUri: process.env.JWT_JWKS_URI,
      algorithm: 'HS256', // process.env.JWT_ALGORITHM,
      accessToken: {
        kid: process.env.JWT_ACCESS_TOKEN_KID,
        expirationTime: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
        expirationTimeMs: parseExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME, '1h'),
      },
      refreshToken: {
        kid: process.env.JWT_REFRESH_TOKEN_KID,
        expirationTime: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
        expirationTimeMs: parseExpirationTime(process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME, '7d'),
      },
    },
    resendApiKey: process.env.RESEND_API_KEY
  }),
);