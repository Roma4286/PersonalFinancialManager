import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wallet } from '@prisma/client';
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

  async getBalance(walletId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: {
        balanceInCents: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException(`The wallet with id ${walletId} not found`);
    }

    return wallet.balanceInCents;
  }

  async getStats(query: StatsFiltersDto) {
    let queryBuilder = this.kysely
      .selectFrom('Transaction')
      .innerJoin('Category', 'Category.id', 'Transaction.categoryId')
      .select([
        'Category.name',
        (eb) =>
          eb.fn<number>('abs', [eb.fn.sum('amountInCents')]).as('totalAmount'),
        'Category.type',
      ])
      .where('Transaction.walletId', '=', query.walletId)
      .where('Transaction.transferGroupId', 'is', null)
      .groupBy(['Transaction.categoryId', 'Category.name', 'Category.type']);

    if (query.from) {
      queryBuilder = queryBuilder.where('date', '>=', new Date(query.from));
    }

    if (query.to) {
      queryBuilder = queryBuilder.where(
        'date',
        '<=',
        new Date(new Date(query.to).getTime() + 24 * 60 * 60 * 1000),
      );
    }

    const result = await queryBuilder.execute();

    return result.map((categoryTotal) => ({
      ...categoryTotal,
      totalAmount: String(categoryTotal.totalAmount),
    }));
  }
}
