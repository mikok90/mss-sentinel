import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] });
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'widget', method: RequestMethod.GET }],
  });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`MSS Backend running on port ${port}`);
}
bootstrap();
