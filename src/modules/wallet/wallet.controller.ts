import { Controller, Get, Param, SerializeOptions } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { BalanceResponse, WalletResponse } from './dto/wallet-response.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';

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
}
