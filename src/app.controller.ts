import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import type { TransactionDto } from './dto/create-transaction.js';

@Controller('/transactions')
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/')
  getAllTransactions() {
    return this.appService.getAllTransactions();
  }

  @Get(':id')
  getOneTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getOneTransaction(id);
  }

  @Get('/stats')
  getBalance() {
    return this.appService.getBalance();
  }

  @Post('/')
  createNewTransaction(@Body() transactionDto: TransactionDto) {
    return this.appService.createNewTransaction(transactionDto);
  }

  @Delete('/:id')
  deleteTransaction(@Param('id', ParseIntPipe) id: number) {
    this.appService.deleteTransaction(id);
    return [];
  }
}
