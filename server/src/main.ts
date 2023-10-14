import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { CustomLogger } from './logger/logger';
import { json } from 'body-parser';
const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: new CustomLogger(),
  });
  app.use(json({ limit: '50mb' }));

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT');

  try {
    if (configService.get('HTTP_PROXY_ENABLED') === 'true') {
      const url = configService.get('HTTP_PROXY_URL');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const proxy = require('node-global-proxy').default;
      proxy.setConfig(url);
      proxy.start();
      logger.warn(`node-global-proxy enabled: ${url}`);
    }
  } catch (_) {
    //
  }

  await app.listen(port, () => {
    logger.log(`listen at ${port}`);
  });
}

bootstrap();
