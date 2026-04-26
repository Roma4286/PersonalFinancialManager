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
  AllWalletsWithAllTransactions,
  BalanceResponse,
  Transaction,
} from './dto/transaction-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { IdParamDto } from './dto/get-id.dto';
import { GetBalanceDto } from './dto/get-balance.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('/transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('/wallets')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: AllWalletsWithAllTransactions,
    isArray: true,
  })
  async getAllTransactions() {
    return await this.transactionService.getAllWalletsWithAllTransactions();
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
  async getOneTransaction(@Param() params: IdParamDto) {
    return await this.transactionService.getTransactionById(params.id);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
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

  @Post('/update')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
    type: Transaction,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 404,
    description: 'Invalid transaction or category Id',
  })
  async upateTransaction(@Body() newTrasnsaction: UpdateTransactionDto) {
    return await this.transactionService.updateTransaction(newTrasnsaction);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Invalid Id.' })
  async deleteTransaction(@Param() params: IdParamDto) {
    await this.transactionService.deleteTransaction(params.id);
  }
}
