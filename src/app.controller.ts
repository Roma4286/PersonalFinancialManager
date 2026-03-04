import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { TransactionDto } from './dto/transaction.dto.js';

@Controller('/transactions')
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/')
  getAllTransactions() {
    return this.appService.getAllTransactions();
  }

  @Get('/stats')
  getBalance() {
    return this.appService.getBalance();
  }

  @Get('/:id')
  getOneTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getOneTransaction(id);
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
