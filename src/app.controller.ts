import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiResponse } from '@nestjs/swagger';
import {
  BalanceResponse,
  TransactionResponse,
} from './dto/transaction-response.dto.js';
import { TransactionDto } from './dto/create-transaction.dto.js';
import { FindTransactionDto } from './dto/find-transaction.dto.js';
import { RemoveTransactionDto } from './dto/remove-transaction.dto.js';

@Controller('/transactions')
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: TransactionResponse,
    isArray: true,
  })
  getAllTransactions() {
    return this.appService.getAllTransactions();
  }

  @Get('/stats')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  getBalance() {
    return { totalBalance: this.appService.getBalance() };
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: TransactionResponse,
  })
  @ApiResponse({ status: 404, description: 'Invalide Id.' })
  getOneTransaction(@Param() params: FindTransactionDto) {
    const response = this.appService.getOneTransaction(params.id);

    if (response === null) {
      throw new NotFoundException(`Transaction with id ${params.id} not found`);
    }

    return response;
  }

  @Post('/')
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: TransactionResponse,
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
  deleteTransaction(@Param() params: RemoveTransactionDto) {
    const response = this.appService.deleteTransaction(params.id);

    if (response === -1) {
      throw new NotFoundException(`Transaction with id ${params.id} not found`);
    }
  }
}
