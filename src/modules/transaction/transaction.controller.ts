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
import { BalanceResponse } from './dto/transaction-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionDto } from './dto/get-transaction.dto';
import { RemoveTransactionDto } from './dto/remove-transaction.dto';
import { Transaction } from './transaction.entity';

@Controller('/transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: Transaction,
    isArray: true,
  })
  async getAllTransactions() {
    return await this.transactionService.getAllTransactions();
  }

  @Get('/stats')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  async getBalance() {
    return { totalBalance: await this.transactionService.getBalance() };
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: Transaction,
  })
  @ApiResponse({ status: 404, description: 'Invalid Id.' })
  async getOneTransaction(@Param() params: GetTransactionDto) {
    const response = await this.transactionService.getTransactionById(
      params.id,
    );

    if (response === null) {
      throw new NotFoundException(`Transaction with id ${params.id} not found`);
    }

    return response;
  }

  @Post('/')
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: Transaction,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Invalid category Id' })
  async createNewTransaction(@Body() transactionDto: CreateTransactionDto) {
    const response =
      await this.transactionService.createNewTransaction(transactionDto);
    if (response) {
      return response;
    }

    throw new NotFoundException(
      `Category with id ${transactionDto.categoryId} not found`,
    );
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Invalid Id.' })
  async deleteTransaction(@Param() params: RemoveTransactionDto) {
    const response = await this.transactionService.deleteTransaction(params.id);

    if (!response) {
      throw new NotFoundException(`Transaction with id ${params.id} not found`);
    }
  }
}
