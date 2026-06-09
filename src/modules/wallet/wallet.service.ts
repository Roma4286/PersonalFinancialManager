import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Wallet } from '@prisma/client';
import { StatsFiltersDto } from './dto/get-stats.dto';
import { KyselyService } from '../kysely/kysely.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private kysely: KyselyService,
  ) {}

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

  async getStats(query: StatsFiltersDto) {
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);

    toDate.setDate(toDate.getDate() + 1);

    const result = await this.kysely
      .selectFrom('Transaction')
      .innerJoin('Category', 'Category.id', 'Transaction.categoryId')
      .select([
        'Category.name',
        (eb) => eb.fn.sum('amount').as('totalAmount'),
        'Category.type',
      ])
      .where('date', '>=', fromDate)
      .where('date', '<', toDate)
      .where('Transaction.walletId', '=', query.walletId)
      .groupBy(['Transaction.categoryId', 'Category.name', 'Category.type'])
      .execute();

    return result.map((item) => ({
      ...item,
      totalAmount: String(item.totalAmount),
    }));
  }
}
