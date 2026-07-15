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
  SerializeOptions,
} from '@nestjs/common';
import { TransferService } from './transfer.service';
import { ApiResponse } from '@nestjs/swagger';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferGroupIdParamDto } from './dto/transfer-group-id-param.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransferResponse } from './dto/transfer-response.dto';

@Controller('/transactions/transfers')
export class TransferController {
  constructor(private transferService: TransferService) {}

  @Get('/:transferGroupId')
  @SerializeOptions({ type: TransferResponse, excludeExtraneousValues: true })
  @ApiResponse({
    status: 200,
    description: 'Retrieve one transfer.',
    type: TransferResponse,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransfer(@Param() params: TransferGroupIdParamDto) {
    return await this.transferService.getTransfer(params.transferGroupId);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @SerializeOptions({ type: TransferResponse, excludeExtraneousValues: true })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: TransferResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async createNewTransfer(@Body() transferDto: CreateTransferDto) {
    return await this.transferService.createNewTransfer(transferDto);
  }

  @Patch('/:transferGroupId')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: TransferResponse, excludeExtraneousValues: true })
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
    return await this.transferService.updateNewTransfer(
      params.transferGroupId,
      dto,
    );
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
