import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller('/transactions')
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/stats')
  getAll() {
    return this.appService.getBalance();
  }
}
