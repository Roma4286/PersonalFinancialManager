import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Kysely } from 'kysely';
import { DB } from '@/db/types';
import { KyselyService } from '../kysely/kysely.service';
import { createId } from '@paralleldrive/cuid2';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { WalletService } from '../wallet/wallet.service';
import { withSerializableRetry } from '@/common/utils/with-serializable-retry';

interface TransferLegInput {
  transferGroupId: string;
  walletId: string;
  categoryId: string;
  amountInCents: number;
  description?: string;
  date?: Date;
}

@Injectable()
export class TransferService {
  constructor(
    private kysely: KyselyService,
    private walletService: WalletService,
  ) {}

  private async loadTransferLegs(tx: Kysely<DB>, transferGroupId: string) {
    const legs = await tx
      .selectFrom('Transaction')
      .innerJoin('Category', 'Category.id', 'Transaction.categoryId')
      .select([
        'Transaction.id',
        'Transaction.walletId',
        'Transaction.amountInCents',
        'Category.type',
      ])
      .where('transferGroupId', '=', transferGroupId)
      .execute();

    if (legs.length !== 2) {
      throw new NotFoundException(`Transfer ${transferGroupId} not found`);
    }

    return legs;
  }

  private insertTransferLeg(tx: Kysely<DB>, leg: TransferLegInput) {
    return tx
      .insertInto('Transaction')
      .values({
        id: createId(),
        updatedAt: new Date(),
        categoryId: leg.categoryId,
        walletId: leg.walletId,
        description: leg.description,
        amountInCents: leg.amountInCents,
        ...(leg.date && { date: leg.date }),
        transferGroupId: leg.transferGroupId,
      })
      .execute();
  }

  async getAllTransfers() {
    const legs = await this.kysely
      .selectFrom('Transaction')
      .innerJoin('Category', 'Category.id', 'Transaction.categoryId')
      .innerJoin('Wallet', 'Wallet.id', 'Transaction.walletId')
      .select([
        'Transaction.transferGroupId',
        'Transaction.walletId',
        'Wallet.name as walletName',
        'Category.type',
        'Transaction.amountInCents'
      ])
      .where('Transaction.transferGroupId', 'is not', null)
      .execute();

    const transfersByGroupId = new Map<
      string,
      {
        fromWalletId?: string;
        fromWalletName?: string;
        toWalletId?: string;
        toWalletName?: string;
        amountInCents?: number;
      }
    >();

    for (const leg of legs) {
      const transferGroupId = leg.transferGroupId!;
      const entry = transfersByGroupId.get(transferGroupId) ?? {};

      if (leg.type === TransactionType.EXPENSE) {
        entry.fromWalletId = leg.walletId;
        entry.fromWalletName = leg.walletName;
      } else {
        entry.toWalletId = leg.walletId;
        entry.toWalletName = leg.walletName;
        entry.amountInCents = leg.amountInCents;
      }

      transfersByGroupId.set(transferGroupId, entry);
    }

    return Array.from(transfersByGroupId.entries()).map(
      ([transferGroupId, sides]) => ({
        transferGroupId,
        fromWalletId: sides.fromWalletId!,
        fromWalletName: sides.fromWalletName!,
        toWalletId: sides.toWalletId!,
        toWalletName: sides.toWalletName!,
        amountInCents: sides.amountInCents!,
      }),
    );
  }

  async getTransfer(transferGroupId: string) {
    const transactions = await this.kysely
      .selectFrom('Transaction')
      .selectAll()
      .where('transferGroupId', '=', transferGroupId)
      .execute();

    if (transactions.length === 0) {
      throw new NotFoundException(`Transfer ${transferGroupId} not found`);
    }

    return { transferGroupId, transactions };
  }

  async createNewTransfer(dto: CreateTransferDto) {
    if (dto.fromWalletId === dto.toWalletId) {
      throw new BadRequestException(
        'The fromWalletId and toWalletId must not be the same',
      );
    }

    const transferExpenseCategoryId = process.env.TRANSFER_EXPENSE_CATEGORY_ID;
    const transferIncomeCategoryId = process.env.TRANSFER_INCOME_CATEGORY_ID;

    if (!transferExpenseCategoryId || !transferIncomeCategoryId) {
      throw new InternalServerErrorException(
        'Transfer category ids are not configured',
      );
    }

    const date = dto.date ? new Date(dto.date) : undefined;
    const transferGroupId = createId();

    const transactions = await withSerializableRetry(() =>
      this.kysely
        .transaction()
        .setIsolationLevel('serializable')
        .execute(async (tx) => {
          await this.walletService.checkWalletKysely(
            [dto.fromWalletId, dto.toWalletId],
            tx,
          );

          await this.walletService.updateBalanceKysely(
            dto.fromWalletId,
            -dto.amountInCents,
            tx,
          );

          await this.insertTransferLeg(tx, {
            transferGroupId,
            walletId: dto.fromWalletId,
            categoryId: transferExpenseCategoryId,
            amountInCents: -dto.amountInCents,
            description: dto.description,
            date,
          });

          await this.walletService.updateBalanceKysely(
            dto.toWalletId,
            dto.amountInCents,
            tx,
          );

          await this.insertTransferLeg(tx, {
            transferGroupId,
            walletId: dto.toWalletId,
            categoryId: transferIncomeCategoryId,
            amountInCents: dto.amountInCents,
            description: dto.description,
            date,
          });

          return await tx
            .selectFrom('Transaction')
            .selectAll()
            .where('transferGroupId', '=', transferGroupId)
            .execute();
        }),
    );

    return { transferGroupId, transactions };
  }

  async updateNewTransfer(transferGroupId: string, dto: UpdateTransferDto) {
    const transactions = await withSerializableRetry(() =>
      this.kysely
        .transaction()
        .setIsolationLevel('serializable')
        .execute(async (tx) => {
          const legs = await this.loadTransferLegs(tx, transferGroupId);

          const expenseLeg = legs.find(
            (leg) => leg.type === TransactionType.EXPENSE,
          );
          const incomeLeg = legs.find(
            (leg) => leg.type === TransactionType.INCOME,
          );

          if (!expenseLeg || !incomeLeg) {
            throw new InternalServerErrorException(
              `Transfer ${transferGroupId} is malformed`,
            );
          }

          if (
            dto.amountInCents !== undefined &&
            dto.amountInCents !== incomeLeg.amountInCents
          ) {
            const delta = dto.amountInCents - incomeLeg.amountInCents;

            await this.walletService.updateBalanceKysely(
              expenseLeg.walletId,
              -delta,
              tx,
            );

            await this.walletService.updateBalanceKysely(
              incomeLeg.walletId,
              delta,
              tx,
            );

            await tx
              .updateTable('Transaction')
              .set({ amountInCents: -dto.amountInCents, updatedAt: new Date() })
              .where('id', '=', expenseLeg.id)
              .execute();

            await tx
              .updateTable('Transaction')
              .set({ amountInCents: dto.amountInCents, updatedAt: new Date() })
              .where('id', '=', incomeLeg.id)
              .execute();
          }

          const commonUpdateData = {
            ...(dto.date !== undefined && {
              date: new Date(dto.date),
            }),
            ...(dto.description !== undefined && {
              description: dto.description,
            }),
          };

          if (Object.keys(commonUpdateData).length > 0) {
            await tx
              .updateTable('Transaction')
              .set({ ...commonUpdateData, updatedAt: new Date() })
              .where('transferGroupId', '=', transferGroupId)
              .execute();
          }

          return await tx
            .selectFrom('Transaction')
            .selectAll()
            .where('transferGroupId', '=', transferGroupId)
            .execute();
        }),
    );

    return { transferGroupId, transactions };
  }

  async deleteTransfer(transferGroupId: string) {
    return await withSerializableRetry(() =>
      this.kysely
        .transaction()
        .setIsolationLevel('serializable')
        .execute(async (tx) => {
          const legs = await this.loadTransferLegs(tx, transferGroupId);

          for (const leg of legs) {
            const reversalDelta = -leg.amountInCents;

            await this.walletService.updateBalanceKysely(
              leg.walletId,
              reversalDelta,
              tx,
            );
          }

          await tx
            .deleteFrom('Transaction')
            .where('transferGroupId', '=', transferGroupId)
            .execute();
        }),
    );
  }
}
