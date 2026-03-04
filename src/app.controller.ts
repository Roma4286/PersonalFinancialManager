import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { TransactionDto } from './dto/transaction.dto.js';
import { ApiResponse } from '@nestjs/swagger';
import {
  BalanceResponseDto,
  TypeTransactionResponse,
} from './dto/transaction-response.dto.js';

@Controller('/transactions')
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: TypeTransactionResponse,
    isArray: true,
  })
  getAllTransactions() {
    return this.appService.getAllTransactions();
  }

  @Get('/stats')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponseDto,
  })
  getBalance() {
    return { totalBalans: this.appService.getBalance() };
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: TypeTransactionResponse,
  })
  @ApiResponse({ status: 404, description: 'Invalide Id.' })
  getOneTransaction(@Param('id', ParseIntPipe) id: number) {
    console.log(this.appService.getOneTransaction(id));
    return this.appService.getOneTransaction(id);
  }

  @Post('/')
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: TypeTransactionResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  createNewTransaction(@Body() transactionDto: TransactionDto) {
    return this.appService.createNewTransaction(transactionDto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Invalide Id.' })
  deleteTransaction(@Param('id', ParseIntPipe) id: number) {
    this.appService.deleteTransaction(id);
  }
}
