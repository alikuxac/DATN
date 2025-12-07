import { registerAs } from "@nestjs/config";

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
        expirationTime: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
      },
      refreshToken: {
        kid: process.env.JWT_REFRESH_TOKEN_KID,
        expirationTime: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME),
      },
    },
    resendApiKey: process.env.RESEND_API_KEY
  }),
);