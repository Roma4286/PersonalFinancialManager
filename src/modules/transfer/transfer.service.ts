import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { KyselyService } from '../kysely/kysely.service';
import { createId } from '@paralleldrive/cuid2';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';

@Injectable()
export class TransferService {
  constructor(private kysely: KyselyService) {}

  async createNewTransfer(
    dto: CreateTransferDto,
  ): Promise<{ transferGroupId: string }> {
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

    const transferGroupId = await this.kysely
      .transaction()
      .setIsolationLevel('serializable')
      .execute(async (tx) => {
        const wallets = await tx
          .selectFrom('Wallet')
          .select(['id'])
          .where('id', 'in', [dto.fromWalletId, dto.toWalletId])
          .execute();

        const walletIds = new Set(wallets.map((wallet) => wallet.id));

        if (!walletIds.has(dto.fromWalletId)) {
          throw new NotFoundException(
            `The wallet with id ${dto.fromWalletId} not found`,
          );
        }

        if (!walletIds.has(dto.toWalletId)) {
          throw new NotFoundException(
            `The wallet with id ${dto.toWalletId} not found`,
          );
        }

        await tx
          .updateTable('Wallet')
          .set((eb) => ({
            balanceInCents: eb('balanceInCents', '-', dto.amountInCents),
            updatedAt: new Date(),
          }))
          .where('id', '=', dto.fromWalletId)
          .execute();

        const transferGroupId = createId();

        await tx
          .insertInto('Transaction')
          .values({
            id: createId(),
            updatedAt: new Date(),
            categoryId: transferExpenseCategoryId,
            walletId: dto.fromWalletId,
            description: dto.description,
            amountInCents: -dto.amountInCents,
            ...(date && { date }),
            transferGroupId: transferGroupId,
          })
          .execute();

        await tx
          .updateTable('Wallet')
          .set((eb) => ({
            balanceInCents: eb('balanceInCents', '+', dto.amountInCents),
            updatedAt: new Date(),
          }))
          .where('id', '=', dto.toWalletId)
          .execute();

        await tx
          .insertInto('Transaction')
          .values({
            id: createId(),
            updatedAt: new Date(),
            categoryId: transferIncomeCategoryId,
            walletId: dto.toWalletId,
            description: dto.description,
            amountInCents: dto.amountInCents,
            ...(date && { date }),
            transferGroupId: transferGroupId,
          })
          .execute();

        return transferGroupId;
      });

    return { transferGroupId };
  }

  async updateNewTransfer(
    transferGroupId: string,
    dto: UpdateTransferDto,
  ): Promise<{ transferGroupId: string }> {
    await this.kysely
      .transaction()
      .setIsolationLevel('serializable')
      .execute(async (tx) => {
        const transactions = await tx
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

        if (transactions.length !== 2) {
          throw new NotFoundException(`Transfer ${transferGroupId} not found`);
        }

        const expenseLeg = transactions.find(
          (transaction) => transaction.type === TransactionType.EXPENSE,
        );
        const incomeLeg = transactions.find(
          (transaction) => transaction.type === TransactionType.INCOME,
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

          await tx
            .updateTable('Wallet')
            .set((eb) => ({
              balanceInCents: eb('balanceInCents', '-', delta),
              updatedAt: new Date(),
            }))
            .where('id', '=', expenseLeg.walletId)
            .execute();

          await tx
            .updateTable('Wallet')
            .set((eb) => ({
              balanceInCents: eb('balanceInCents', '+', delta),
              updatedAt: new Date(),
            }))
            .where('id', '=', incomeLeg.walletId)
            .execute();

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
      });

    return { transferGroupId };
  }

  async deleteTransfer(transferGroupId: string) {
    return await this.kysely
      .transaction()
      .setIsolationLevel('serializable')
      .execute(async (tx) => {
        const transactions = await tx
          .selectFrom('Transaction')
          .select(['id', 'walletId', 'amountInCents'])
          .where('transferGroupId', '=', transferGroupId)
          .execute();

        if (transactions.length !== 2) {
          throw new NotFoundException(`Transfer ${transferGroupId} not found`);
        }

        for (const transaction of transactions) {
          const reversalDelta = -transaction.amountInCents;

          await tx
            .updateTable('Wallet')
            .set((eb) => ({
              balanceInCents: eb('balanceInCents', '+', reversalDelta),
              updatedAt: new Date(),
            }))
            .where('id', '=', transaction.walletId)
            .execute();
        }

        await tx
          .deleteFrom('Transaction')
          .where('transferGroupId', '=', transferGroupId)
          .execute();
      });
  }
}
