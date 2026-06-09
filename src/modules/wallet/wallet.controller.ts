import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import {
  BalanceResponse,
  StatsResponse,
  Wallet,
} from './dto/response-wallet.dto';
import { GetBalanceDto } from './dto/get-balance.dto';
import { StatsFiltersDto } from './dto/get-stats.dto';

@Controller('/wallets')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: Wallet,
    isArray: true,
  })
  async getAllWallets() {
    return await this.walletService.getAllWallets();
  }

  @Get('/:id/balance')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  @ApiResponse({ status: 404, description: 'Invalid wallet Id.' })
  async getBalance(@Param() params: GetBalanceDto) {
    return {
      totalBalance: await this.walletService.getBalance(params.id),
    };
  }

  @Get('/stats')
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: StatsResponse,
    isArray: true,
  })
  async getStats(@Query() query: StatsFiltersDto) {
    return await this.walletService.getStats(query);
  }
}
