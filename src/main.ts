import { NestFactory } from '@nestjs/core';
import { AppModules } from './app.modules.js';
import { ValidationPipe } from '@nestjs/common';

async function main() {
  const PORT = 3000;
  const app = await NestFactory.create(AppModules);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
}

main();
