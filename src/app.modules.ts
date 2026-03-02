import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModules {}
