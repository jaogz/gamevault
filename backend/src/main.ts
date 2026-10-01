import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Fotos de perfil/capa vêm como base64 no corpo da requisição,
  // então o limite padrão (100kb) precisa ser maior.
  app.use(json({ limit: '8mb' }));

  // Projeto acadêmico: libera qualquer origem para evitar erro de CORS
  // (localhost, site publicado, etc).
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend rodando na porta ${port}`);
}
bootstrap();
