import { Injectable, NotFoundException } from '@nestjs/common';
import { Wallet } from '@prisma/client';
import { KyselyService } from '../kysely/kysely.service';
import { Kysely } from 'kysely';
import { DB } from '@/db/types';

@Injectable()
export class WalletService {
  constructor(private kysely: KyselyService) {}

  async getAllWallets(): Promise<Wallet[]> {
    return await this.kysely.selectFrom('Wallet').selectAll().execute();
  }

  async getBalance(walletId: string): Promise<number> {
    const wallet = await this.kysely
      .selectFrom('Wallet')
      .select(['balanceInCents'])
      .where('id', '=', walletId)
      .executeTakeFirst();

    if (!wallet) {
      throw new NotFoundException(`The wallet with id ${walletId} not found`);
    }

    return wallet.balanceInCents;
  }

  async findWalletOrThrow(
    walletId: string,
    tx: Kysely<DB> = this.kysely,
  ): Promise<Wallet> {
    const wallet = await tx
      .selectFrom('Wallet')
      .selectAll()
      .where('id', '=', walletId)
      .executeTakeFirst();

    if (!wallet) {
      throw new NotFoundException(`The wallet with id ${walletId} not found`);
    }

    return wallet;
  }

  async updateBalance(
    walletId: string,
    deltaInCents: number,
    tx: Kysely<DB> = this.kysely,
    updatedAt: Date = new Date(),
  ): Promise<void> {
    await tx
      .updateTable('Wallet')
      .set((eb) => ({
        balanceInCents: eb('balanceInCents', '+', deltaInCents),
        updatedAt,
      }))
      .where('id', '=', walletId)
      .execute();
  }
}
