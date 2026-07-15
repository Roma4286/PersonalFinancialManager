import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { TransferService } from './transfer.service';
import { ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferGroupIdParamDto } from './dto/transfer-group-id-param.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransferResponse } from './dto/transfer-response.dto';

@Controller('/transactions/transfers')
export class TransferController {
  constructor(private transferService: TransferService) {}

  @Get('/:transferGroupId')
  @ApiResponse({
    status: 200,
    description: 'Retrieve one transfer.',
    type: TransferResponse,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransfer(@Param() params: TransferGroupIdParamDto) {
    const transfer = await this.transferService.getTransfer(
      params.transferGroupId,
    );
    return plainToInstance(TransferResponse, transfer, {
      excludeExtraneousValues: true,
    });
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: TransferResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async createNewTransfer(@Body() transferDto: CreateTransferDto) {
    const transfer = await this.transferService.createNewTransfer(transferDto);
    return plainToInstance(TransferResponse, transfer, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('/:transferGroupId')
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
    const transfer = await this.transferService.updateNewTransfer(
      params.transferGroupId,
      dto,
    );
    return plainToInstance(TransferResponse, transfer, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('/:transferGroupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Remove transaction.',
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async deleteTransfer(@Param() params: TransferGroupIdParamDto) {
    await this.transferService.deleteTransfer(params.transferGroupId);
  }
}
