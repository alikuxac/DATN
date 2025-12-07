import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions, ThrottlerGuard } from '@nestjs/throttler';
import { AppGeneralFilter } from '@app/filters/app.general.filter';
import { AppRequestIdMiddleware } from './middlewares/app.request-id.middleware';
import { AppHelmetMiddleware } from './middlewares/app.helmet.middleware';
import { AppJsonBodyParserMiddleware, AppRawBodyParserMiddleware, AppTextBodyParserMiddleware, AppUrlencodedBodyParserMiddleware } from './middlewares/app.body-parser.middleware';
import { AppCorsMiddleware } from './middlewares/app.cors.middleware';
import { AppResponseTimeMiddleware } from './middlewares/app.response-time.middleware';
import { AppUserAgentMiddleware } from './middlewares/app.user-agents.middleware';

@Module({
  controllers: [],
  exports: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_FILTER,
      useClass: AppGeneralFilter
    }
  ],
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: configService.get<number>('middleware.throttler.ttl'),
            limit: configService.get<number>('middleware.throttler.limit')
          }
        ]
      })
    })
  ]
})
export class AppMiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(
      AppRequestIdMiddleware,
      AppHelmetMiddleware,
      AppJsonBodyParserMiddleware,
      AppTextBodyParserMiddleware,
      AppRawBodyParserMiddleware,
      AppUrlencodedBodyParserMiddleware,
      AppCorsMiddleware,
      AppResponseTimeMiddleware,
      AppUserAgentMiddleware
    )
    .forRoutes('{*wildcard}');
  }
}