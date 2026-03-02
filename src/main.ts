import { NestFactory } from '@nestjs/core';
import { AppModules } from './app.modules.js';

async function main() {
  const PORT = 5000;
  const app = await NestFactory.create(AppModules);

  app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
}

main();
