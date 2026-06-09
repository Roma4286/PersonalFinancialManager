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
import {
  Transaction,
  TransactionWithCategory,
} from './dto/response-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { IdParamDto } from './dto/get-id.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/get-transactions.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { DeleteTransferDto } from './dto/delete-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';

@Controller('/transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: TransactionWithCategory,
    isArray: true,
  })
  async getAllTransactions(@Query() query: TransactionFilterDto) {
    return await this.transactionService.getAllTransactions(query);
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
    description: 'Invalid transaction or category Id',
  })
  async updateTransaction(
    @Param('id') transactionId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return await this.transactionService.updateTransaction(transactionId, dto);
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

  @Post('/transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Invalid wallet Id' })
  async createNewTransfer(@Body() transferDto: CreateTransferDto) {
    return await this.transactionService.createNewTransfer(transferDto);
  }

  @Patch('transfer/:transferGroupId')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 404,
    description: 'Invalid transferGroupId Id',
  })
  async updateTransfer(
    @Param('transferGroupId') transferGroupId: string,
    @Body() dto: UpdateTransferDto,
  ) {
    return await this.transactionService.updateTransfer(transferGroupId, dto);
  }

  @Delete('transfer/:transferGroupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Invalid Id.' })
  async deleteTransfer(@Param() params: DeleteTransferDto) {
    await this.transactionService.deleteTransfer(params.transferGroupId);
  }
}
