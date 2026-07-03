import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Transaction, TransactionType } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/get-transactions.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { KyselyService } from '../kysely/kysely.service';
import { createId } from '@paralleldrive/cuid2';
import { UpdateTransferDto } from './dto/update-transfer.dto';

@Injectable()
export class TransactionService {
  DEFAULT_PAGE_SIZE = 100;
  MAX_PAGE_SIZE = 1000;
  constructor(
    private prisma: PrismaService,
    private kysely: KyselyService,
  ) {}

  async getAllTransactions(filters: TransactionFilterDto) {
    if (filters.from && filters.to) {
      if (new Date(filters.from) > new Date(filters.to)) {
        throw new BadRequestException('from must be <= to');
      }
    }

    const page = filters.page ?? 1;
    const length = Math.min(
      filters.length ?? this.DEFAULT_PAGE_SIZE,
      this.MAX_PAGE_SIZE,
    );

    return await this.prisma.transaction.findMany({
      orderBy: {
        date: 'desc',
      },
      where: {
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.walletId && { walletId: filters.walletId }),
        ...(filters.transactionType && {
          category: {
            is: {
              type: filters.transactionType,
            },
          },
        }),
        ...((filters.from || filters.to) && {
          date: {
            ...(filters.from && { gte: new Date(filters.from) }),
            ...(filters.to && { lte: new Date(filters.to) }),
          },
        }),
      },
      skip: (page - 1) * length,
      take: length,
    });
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { category: true },
    });

    if (!transaction) {
      throw new NotFoundException(
        `The transaction with id ${transactionId} not found`,
      );
    }

    return transaction;
  }

  async createNewTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    return await this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { id: dto.walletId },
        });

        if (!wallet) {
          throw new NotFoundException(
            `The wallet with id ${dto.walletId} not found`,
          );
        }

        const category = await tx.category.findUnique({
          where: { id: dto.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `The category with id ${dto.categoryId} not found`,
          );
        }

        const signedAmountInCents =
          category.type === TransactionType.EXPENSE
            ? -dto.amountInCents
            : dto.amountInCents;

        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balanceInCents: { increment: signedAmountInCents } },
        });

        const date = dto.date ? new Date(dto.date) : new Date();

        return await tx.transaction.create({
          data: {
            amountInCents: signedAmountInCents,
            description: dto.description,
            date: date,
            walletId: dto.walletId,
            categoryId: dto.categoryId,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async updateTransaction(transactionId: string, dto: UpdateTransactionDto) {
    return await this.prisma.$transaction(
      async (tx) => {
        const [oldTransaction, category] = await Promise.all([
          tx.transaction.findUnique({ where: { id: transactionId } }),
          tx.category.findUnique({ where: { id: dto.categoryId } }),
        ]);

        if (!oldTransaction) {
          throw new NotFoundException(
            `The transaction with id ${transactionId} not found`,
          );
        }

        if (oldTransaction.transferGroupId) {
          throw new BadRequestException(
            'Use the /transfer endpoints to modify transfer records',
          );
        }

        if (!category) {
          throw new NotFoundException(
            `The category with id ${dto.categoryId} not found`,
          );
        }

        const newSignedAmountInCents =
          category.type === TransactionType.EXPENSE
            ? -dto.amountInCents
            : dto.amountInCents;

        const balanceDelta =
          newSignedAmountInCents - oldTransaction.amountInCents;

        await tx.wallet.update({
          where: { id: oldTransaction.walletId },
          data: { balanceInCents: { increment: balanceDelta } },
        });

        return await tx.transaction.update({
          where: { id: transactionId },
          data: {
            amountInCents: newSignedAmountInCents,
            description: dto.description,
            date: dto.date ? new Date(dto.date) : undefined,
            categoryId: dto.categoryId,
          },
        });
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  async deleteTransaction(transactionId: string): Promise<Transaction> {
    return await this.prisma.$transaction(
      async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) {
          throw new NotFoundException(
            `The transaction with id ${transactionId} not found`,
          );
        }

        if (transaction.transferGroupId) {
          throw new BadRequestException(
            'Use the /transfer endpoints to modify transfer records',
          );
        }

        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balanceInCents: { increment: -transaction.amountInCents },
          },
        });

        return await tx.transaction.delete({
          where: { id: transaction.id },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async createNewTransfer(dto: CreateTransferDto) {
    if (dto.fromWalletId === dto.toWalletId ) {
      throw new BadRequestException(
        'The oldWalletId and newWalletId should not be the same',
      );
    }

    const transferExpenseCategoryId = process.env.TRANSFER_EXPENSE_CATEGORY_ID;
    const transferIncomeCategoryId = process.env.TRANSFER_INCOME_CATEGORY_ID;

    if (!transferExpenseCategoryId || !transferIncomeCategoryId) {
      throw new InternalServerErrorException(
        'Transfer category ids are not configured',
      );
    }

    return await this.kysely
      .transaction()
      .setIsolationLevel('serializable')
      .execute(async (tx) => {
        const wallets = await tx
          .selectFrom('Wallet')
          .select(['id'])
          .where('id', 'in', [dto.fromWalletId, dto.toWalletId ])
          .execute();

        const walletIds = new Set(wallets.map((w) => w.id));

        if (!walletIds.has(dto.fromWalletId)) {
          throw new NotFoundException(
            `The wallet with id ${dto.fromWalletId} not found`,
          );
        }

        if (!walletIds.has(dto.toWalletId )) {
          throw new NotFoundException(
            `The wallet with id ${dto.toWalletId } not found`,
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
            date: dto.date,
            transferGroupId: transferGroupId,
          })
          .execute();

        await tx
          .updateTable('Wallet')
          .set((eb) => ({
            balanceInCents: eb('balanceInCents', '+', dto.amountInCents),
            updatedAt: new Date(),
          }))
          .where('id', '=', dto.toWalletId )
          .execute();

        await tx
          .insertInto('Transaction')
          .values({
            id: createId(),
            updatedAt: new Date(),
            categoryId: transferIncomeCategoryId,
            walletId: dto.toWalletId ,
            description: dto.description,
            amountInCents: dto.amountInCents,
            date: dto.date,
            transferGroupId: transferGroupId,
          })
          .execute();
      });
  }

  async updateTransfer(transferGroupId: string, dto: UpdateTransferDto) {
    return await this.kysely
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
            date: dto.date,
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
