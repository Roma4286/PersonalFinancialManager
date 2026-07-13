import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Wallet } from '@prisma/client';
import { DateRangeDto } from '@/common/dto/date-range.dto';
import { KyselyService } from '../kysely/kysely.service';
import { Kysely } from 'kysely';
import { DB } from '@/db/types';

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

  async checkWallet(
    walletId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Wallet> {
    const wallet = await tx.wallet.findUnique({ where: { id: walletId } });

    if (!wallet) {
      throw new NotFoundException(`The wallet with id ${walletId} not found`);
    }

    return wallet;
  }

  async updateBalance(
    walletId: string,
    deltaInCents: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await tx.wallet.update({
      where: { id: walletId },
      data: { balanceInCents: { increment: deltaInCents } },
    });
  }

  async checkWalletKysely(
    walletIds: string[],
    tx: Kysely<DB> = this.kysely,
  ): Promise<void> {
    const wallets = await tx
      .selectFrom('Wallet')
      .select(['id'])
      .where('id', 'in', walletIds)
      .execute();

    const foundWalletIds = new Set(wallets.map((wallet) => wallet.id));

    for (const walletId of walletIds) {
      if (!foundWalletIds.has(walletId)) {
        throw new NotFoundException(`The wallet with id ${walletId} not found`);
      }
    }
  }

  async updateBalanceKysely(
    walletId: string,
    deltaInCents: number,
    tx: Kysely<DB> = this.kysely,
  ): Promise<void> {
    await tx
      .updateTable('Wallet')
      .set((eb) => ({
        balanceInCents: eb('balanceInCents', '+', deltaInCents),
        updatedAt: new Date(),
      }))
      .where('id', '=', walletId)
      .execute();
  }

  async getStats(walletId: string, query: DateRangeDto) {
    await this.checkWallet(walletId);

    let queryBuilder = this.kysely
      .selectFrom('Transaction')
      .innerJoin('Category', 'Category.id', 'Transaction.categoryId')
      .select([
        'Category.name',
        (eb) =>
          eb
            .fn<string>('abs', [eb.fn.sum('amountInCents')])
            .as('totalAmountInCents'),
        'Category.type',
      ])
      .where('Transaction.walletId', '=', walletId)
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
      totalAmountInCents: String(categoryTotal.totalAmountInCents),
    }));
  }
}
