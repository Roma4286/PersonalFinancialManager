import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
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
    const wallets = await this.walletService.getAllWallets();
    return plainToInstance(Wallet, wallets, { excludeExtraneousValues: true });
  }

  @Get('/:id/balance')
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  @ApiResponse({ status: 404, description: 'Invalid wallet Id.' })
  async getBalance(@Param() params: GetBalanceDto) {
    const totalBalance = await this.walletService.getBalance(params.id);
    return plainToInstance(
      BalanceResponse,
      { totalBalance },
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
