import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiResponse } from '@nestjs/swagger';
import {
  AllTransactions,
  BalanceResponse,
} from './dto/transaction-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionDto } from './dto/get-transaction.dto';
import { RemoveTransactionDto } from './dto/remove-transaction.dto';
import { Transaction } from './transaction.entity';
import { GetBalanceDto } from './dto/get-balance.dto';

@Controller('/transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: AllTransactions,
    isArray: true,
  })
  async getAllTransactions() {
    return await this.transactionService.getAllTransactions();
  }

  @Get('/stats/:walletId')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  @ApiResponse({ status: 404, description: 'Invalid wallet Id.' })
  async getBalance(@Param() params: GetBalanceDto) {
    return {
      totalBalance: await this.transactionService.getBalance(params.walletId),
    };
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: Transaction,
  })
  @ApiResponse({ status: 404, description: 'Invalid Id.' })
  async getOneTransaction(@Param() params: GetTransactionDto) {
    return await this.transactionService.getTransactionById(params.id);
  }

  @Post('/')
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: Transaction,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Invalid category or wallet Id' })
  async createNewTransaction(@Body() transactionDto: CreateTransactionDto) {
    return await this.transactionService.createNewTransaction(transactionDto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Invalid Id.' })
  async deleteTransaction(@Param() params: RemoveTransactionDto) {
    await this.transactionService.deleteTransaction(params.id);
  }
}
