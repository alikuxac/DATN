import { registerAs } from '@nestjs/config';

export default registerAs(
  'app',
  (): Record<string, any> => ({
    name: process.env.APP_NAME,
    env: process.env.APP_ENV,
    timezone: process.env.APP_TIMEZONE,
    globalPrefix: '/api',

    http: {
      host: process.env.HTTP_HOST || 'localhost',
      port: process.env.HTTP_PORT ? Number.parseInt(process.env.HTTP_PORT) : 3000,
    },
    urlVersion: {
      enable: process.env.URL_VERSIONING_ENABLE === 'true',
      prefix: 'v',
      version: process.env.URL_VERSION,
    },
  }),
);