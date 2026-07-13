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
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
  TransactionResponse,
  TransactionWithCategoryResponse,
} from './dto/transaction-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

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
  async getTransactions(@Query() query: TransactionFilterDto) {
    const transactions = await this.transactionService.getTransactions(query);
    return plainToInstance(TransactionResponse, transactions, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: TransactionWithCategoryResponse,
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async getTransactionById(@Param() params: IdParamDto) {
    const transaction = await this.transactionService.getTransactionById(
      params.id,
    );
    return plainToInstance(TransactionWithCategoryResponse, transaction, {
      excludeExtraneousValues: true,
    });
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: TransactionResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Category or wallet not found' })
  async createNewTransaction(@Body() transactionDto: CreateTransactionDto) {
    const transaction =
      await this.transactionService.createNewTransaction(transactionDto);
    return plainToInstance(TransactionResponse, transaction, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
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
    const transaction = await this.transactionService.updateTransaction(
      params.id,
      dto,
    );
    return plainToInstance(TransactionResponse, transaction, {
      excludeExtraneousValues: true,
    });
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
