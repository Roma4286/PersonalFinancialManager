import {
  Controller,
  Get,
  Param,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import {
  BalanceResponse,
  StatsResponse,
  WalletResponse,
} from './dto/wallet-response.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { DateRangeDto } from '@/common/dto/date-range.dto';

@Controller('/wallets')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('/')
  @SerializeOptions({ type: WalletResponse, excludeExtraneousValues: true })
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: WalletResponse,
    isArray: true,
  })
  async getAllWallets() {
    return await this.walletService.getAllWallets();
  }

  @Get('/:id/balance')
  @SerializeOptions({ type: BalanceResponse, excludeExtraneousValues: true })
  @ApiResponse({
    status: 200,
    description: 'Financial Summary.',
    type: BalanceResponse,
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async getBalance(@Param() { id: walletId }: IdParamDto) {
    const totalBalanceInCents = await this.walletService.getBalance(walletId);
    return { totalBalanceInCents };
  }

  @Get('/:id/stats')
  @SerializeOptions({ type: StatsResponse, excludeExtraneousValues: true })
  @ApiResponse({
    status: 200,
    description: 'Retrieve all items.',
    type: StatsResponse,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Id not found.' })
  async getStats(
    @Param() { id: walletId }: IdParamDto,
    @Query() query: DateRangeDto,
  ) {
    return await this.walletService.getStats(walletId, query);
  }
}
