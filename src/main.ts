import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app.setup';

async function main() {
  const PORT = 3000;
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Expense Tracking API')
    .setDescription('The Tracking API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  configureApp(app);

  await app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
  app.enableShutdownHooks();
}

main().catch((err) => console.error(err));
