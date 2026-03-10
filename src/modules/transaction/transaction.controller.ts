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
import { TransactionService } from './transaction.service';
import { ApiResponse } from '@nestjs/swagger';
import {
  BalanceResponse,
  TransactionResponse,
} from './dto/transaction-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionDto } from './dto/find-transaction.dto';
import { RemoveTransactionDto } from './dto/remove-transaction.dto';

@Controller('/transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: TransactionResponse,
    isArray: true,
  })
  getAllTransactions() {
    return this.transactionService.getAllTransactions();
  }

  @Get('/stats')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  getBalance() {
    return { totalBalance: this.transactionService.getBalance() };
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: TransactionResponse,
  })
  @ApiResponse({ status: 404, description: 'Invalide Id.' })
  getOneTransaction(@Param() params: FindTransactionDto) {
    const response = this.transactionService.getOneTransaction(params.id);

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
  createNewTransaction(@Body() transactionDto: CreateTransactionDto) {
    return this.transactionService.createNewTransaction(transactionDto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Invalide Id.' })
  deleteTransaction(@Param() params: RemoveTransactionDto) {
    const response = this.transactionService.deleteTransaction(params.id);

    if (response === -1) {
      throw new NotFoundException(`Transaction with id ${params.id} not found`);
    }
  }
}
