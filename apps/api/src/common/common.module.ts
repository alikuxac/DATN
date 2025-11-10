import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from '@nestjs/mongoose';

import Joi from 'joi';
import configs from "../configs";

@Global()
@Module({
  controllers: [],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      load: configs,
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000).required(),
        MONGO_URL: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      connectionName: 'api',
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URL'),
        dbName: 'api',
      }),
    }),
  ]
})
export class CommonModule {}