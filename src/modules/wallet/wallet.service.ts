import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Wallet } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getAllWallets(): Promise<Wallet[]> {
    return await this.prisma.wallet.findMany();
  }

  async getBalance(walletId: string): Promise<string> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: {
        balance: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException(`The wallet with id ${walletId} not found`);
    }

    return String(wallet.balance);
  }

  validateSufficientFunds(wallet: Wallet, amount: Prisma.Decimal) {
    if (wallet.balance.plus(amount).isNegative()) {
      throw new BadRequestException('Insufficient funds');
    }
  }
}
