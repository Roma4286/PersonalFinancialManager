import { NestFactory } from '@nestjs/core';
import { AppModules } from './app.modules.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function main() {
  const PORT = 3000;
  const app = await NestFactory.create(AppModules);

  const config = new DocumentBuilder()
    .setTitle('Expense Tracking API')
    .setDescription('The Tracking API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
}

main().catch((err) => console.log(err));
