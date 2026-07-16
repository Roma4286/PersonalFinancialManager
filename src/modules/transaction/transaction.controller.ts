import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
  SerializeOptions,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiResponse } from '@nestjs/swagger';
import {
  TransactionResponse,
  TransactionWithCategoryResponse,
} from './dto/transaction-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { StatsFilterDto } from './dto/stats-filter.dto';
import { StatsResponse } from './dto/transaction-response.dto';

@Controller('/transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('/')
  @SerializeOptions({
    type: TransactionResponse,
    excludeExtraneousValues: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: TransactionResponse,
    isArray: true,
  })
  async getTransactions(@Query() query: TransactionFilterDto) {
    return await this.transactionService.getTransactions(query);
  }

  @Get('/stats')
  @SerializeOptions({ type: StatsResponse, excludeExtraneousValues: true })
  @ApiResponse({
    status: 200,
    description: 'Retrieve category breakdown for a wallet.',
    type: StatsResponse,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async getStats(@Query() query: StatsFilterDto) {
    return await this.transactionService.getStats(query);
  }

  @Get('/:id')
  @SerializeOptions({
    type: TransactionWithCategoryResponse,
    excludeExtraneousValues: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: TransactionWithCategoryResponse,
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async getTransactionById(@Param() params: IdParamDto) {
    return await this.transactionService.getTransactionById(params.id);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SerializeOptions({
    type: TransactionResponse,
    excludeExtraneousValues: true,
  })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: TransactionResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Category or wallet not found' })
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return await this.transactionService.createTransaction(dto);
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    type: TransactionResponse,
    excludeExtraneousValues: true,
  })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
    type: TransactionResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 404,
    description: 'Transaction or category not found',
  })
  async updateTransaction(
    @Param() params: IdParamDto,
    @Body() dto: UpdateTransactionDto,
  ) {
    return await this.transactionService.updateTransaction(params.id, dto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async deleteTransaction(@Param() params: IdParamDto) {
    await this.transactionService.deleteTransaction(params.id);
  }
}
