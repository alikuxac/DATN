import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailerModule } from '@nestjs-modules/mailer';
import configs from "../configs";

import { PolicyModule } from "@modules/policy/policy.module";
import { DatabaseModule } from "./database/database.module";
import { MessageModule } from "./message/message.module";
import { AuthModule } from "@modules/auth/auth.module";
import { HelperModule } from "./helper/helper.module";
import { RequestModule } from "./request/request.module";
import { PaginationModule } from "./pagination/pagination.module";
import { DatabaseOptionModule } from "./database/database.module";
import { DatabaseOptionService } from "./database/services/database.options.service";
import { DATABASE_CONNECTION_NAME } from "./database/constants/database.constant";
import { BullModule } from "@nestjs/bullmq";
import { CacheModule, CacheOptions } from "@nestjs/cache-manager";
import KeyvRedis from "@keyv/redis";
import path from "path";
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { TelegramModule } from "./telegram/telegram.module";
import { S3Module } from "./s3/s3.module";


@Global()
@Module({
  controllers: [],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      load: configs,
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.development.local'],
      // validationSchema: Joi.object({
      //   PORT: Joi.number().default(3000).required(),
      //   MONGO_URL: Joi.string().required(),
      // }),
      // validationOptions: {
      //   allowUnknown: true,
      //   abortEarly: true,
      // },
    }),
    MongooseModule.forRootAsync({
      inject: [DatabaseOptionService],
      imports: [DatabaseOptionModule],
      connectionName: DATABASE_CONNECTION_NAME,
      useFactory: (databaseService: DatabaseOptionService) =>
        databaseService.createOptions(),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.queue.url'),
          host: configService.get<string>('redis.queue.host'),
          port: configService.get<number>('redis.queue.port'),
          username: configService.get<string>('redis.queue.username'),
          password: configService.get<string>('redis.queue.password'),
          tls: configService.get<any>('redis.queue.tls'),
        },
        defaultJobOptions: {
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          attempts: 3,
        },
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService
      ): Promise<CacheOptions> => ({
        max: configService.get<number>('redis.cached.max'),
        ttl: configService.get<number>('redis.cached.ttl'),
        stores: [
          new KeyvRedis(
            {
              url: configService.get<string>('redis.cached.url'),
              username: configService.get<string>(
                'redis.cached.username'
              ),
              password: configService.get<string>(
                'redis.cached.password'
              )
            }),
          //   createKeyv({
          //     url: configService.get<string>('redis.cached.url'),
          //     socket: {
          //       host: configService.get<string>(
          //         'redis.cached.host'
          //       ),
          //       port: configService.get<number>(
          //         'redis.cached.port'
          //       ),
          //     },
          //     username: configService.get<string>(
          //       'redis.cached.username'
          //     ),
          //     password: configService.get<string>(
          //       'redis.cached.password'
          //     ),
          //   } as RedisClientOptions),
        ],
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('email.smtp.host'),
          port: configService.get<number>('email.smtp.port'),
          secure: configService.get<boolean>('email.smtp.secure'),
          auth: {
            user: configService.get<string>('email.smtp.username'),
            pass: configService.get<string>('email.smtp.password'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('email.fromEmail')}>`,
        },
        preview: false,
        template: {
          dir: path.join(__dirname, '..', 'modules', 'email', 'templates'),
          adapter: new HandlebarsAdapter(undefined, {
            inlineCssEnabled: true,
          }),
          options: {
            strict: false,
          },
        }
      })
    }),
    EventEmitterModule.forRoot(),
    MessageModule.forRoot(),
    HelperModule.forRoot(),
    RequestModule,
    PolicyModule.forRoot(),
    AuthModule.forRoot(),
    TelegramModule,
    S3Module,
    DatabaseModule.forRoot(),
    PaginationModule
  ]
})
export class CommonModule { }