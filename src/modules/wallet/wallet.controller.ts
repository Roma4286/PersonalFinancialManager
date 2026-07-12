import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { WalletService } from './wallet.service';
import {
  BalanceResponse,
  StatsResponse,
  WalletResponse,
} from './dto/wallet-response.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { StatsFiltersDto } from './dto/stats-filters.dto';

@Controller('/wallets')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: WalletResponse,
    isArray: true,
  })
  async getAllWallets() {
    const wallets = await this.walletService.getAllWallets();
    return plainToInstance(WalletResponse, wallets, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id/balance')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async getBalance(@Param() { id: walletId }: IdParamDto) {
    const totalBalanceInCents = await this.walletService.getBalance(walletId);
    return plainToInstance(
      BalanceResponse,
      { totalBalanceInCents },
      { excludeExtraneousValues: true },
    );
  }

  @Get('/stats')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: StatsResponse,
    isArray: true,
  })
  async getStats(@Query() query: StatsFiltersDto) {
    const stats = await this.walletService.getStats(query);
    return plainToInstance(StatsResponse, stats, {
      excludeExtraneousValues: true,
    });
  }
}
