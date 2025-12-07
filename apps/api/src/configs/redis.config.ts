import { registerAs } from '@nestjs/config';

export default registerAs(
    'redis',
    (): Record<string, any> => ({
        cached: {
            url: process.env.REDIS_URL,
            host: process.env.REDIS_HOST,
            port: Number.parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            username: process.env.REDIS_USERNAME,
            ttl: 5 * 60 * 1000, // 5 mins
            max: 10,
        },
        queue: {
            url: process.env.REDIS_URL,
            host: process.env.REDIS_HOST,
            port: Number.parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            username: process.env.REDIS_USERNAME,
        },
    })
);
