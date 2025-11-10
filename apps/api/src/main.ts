import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'warn', 'verbose'],
    bodyParser: false,
  });

  const configService = new ConfigService();

  const port = configService.get('app.port');

  app.enableCors();

  await app.listen(port);
}

void bootstrap();
