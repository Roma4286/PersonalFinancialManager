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
  Transaction,
  TransactionWithCategory,
} from './dto/response-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { IdParamDto } from './dto/get-id.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/get-transactions.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferGroupIdParamDto } from './dto/transfer-group-id-param.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransferResponse } from './dto/response-transfer.dto';

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
  async getTransactions(@Query() query: TransactionFilterDto) {
    const transactions = await this.transactionService.getTransactions(query);
    return plainToInstance(Transaction, transactions, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one item.',
    type: TransactionWithCategory,
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async getOneTransaction(@Param() params: IdParamDto) {
    const transaction = await this.transactionService.getTransactionById(
      params.id,
    );
    return plainToInstance(TransactionWithCategory, transaction, {
      excludeExtraneousValues: true,
    });
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: Transaction,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Category or wallet not found' })
  async createNewTransaction(@Body() transactionDto: CreateTransactionDto) {
    const transaction =
      await this.transactionService.createNewTransaction(transactionDto);
    return plainToInstance(Transaction, transaction, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
    type: Transaction,
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
    return plainToInstance(Transaction, transaction, {
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

  @Post('/transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: TransferResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async createNewTransfer(@Body() transferDto: CreateTransferDto) {
    const transfer =
      await this.transactionService.createNewTransfer(transferDto);
    return plainToInstance(TransferResponse, transfer, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('transfers/:transferGroupId')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
    type: TransferResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 404,
    description: 'Transfer not found',
  })
  async updateTransfer(
    @Param() params: TransferGroupIdParamDto,
    @Body() dto: UpdateTransferDto,
  ) {
    const transfer = await this.transactionService.updateNewTransfer(
      params.transferGroupId,
      dto,
    );
    return plainToInstance(TransferResponse, transfer, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('transfers/:transferGroupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async deleteTransfer(@Param() params: TransferGroupIdParamDto) {
    await this.transactionService.deleteTransfer(params.transferGroupId);
  }
}
