import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'warn', 'verbose'],
    bodyParser: false,
  });

  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.http.port');

  app.enableCors();

  app.setGlobalPrefix('api');

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(port, async () => {
    console.log(`Http server running on ${await app.getUrl()}`);
  });
}

void bootstrap();
