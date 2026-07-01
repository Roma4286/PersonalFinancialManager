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

        const balanceDelta =
          category.type === TransactionType.EXPENSE
            ? -dto.amountInCents
            : dto.amountInCents;

        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balanceInCents: { increment: balanceDelta } },
        });

        const date = dto.date ? new Date(dto.date) : new Date();

        return await tx.transaction.create({
          data: {
            amountInCents: dto.amountInCents,
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
          tx.transaction.findUnique({
            where: { id: transactionId },
            include: { category: true },
          }),
          tx.category.findUnique({ where: { id: dto.categoryId } }),
        ]);

        if (!oldTransaction) {
          throw new NotFoundException(
            `The transaction with id ${transactionId} not found`,
          );
        }

        if (!category) {
          throw new NotFoundException(
            `The category with id ${dto.categoryId} not found`,
          );
        }

        const oldEffect =
          oldTransaction.category.type === TransactionType.EXPENSE
            ? oldTransaction.amountInCents
            : -oldTransaction.amountInCents;

        const newEffect =
          category.type === TransactionType.EXPENSE
            ? -dto.amountInCents
            : dto.amountInCents;

        const balanceDelta = oldEffect + newEffect;

        await tx.wallet.update({
          where: { id: oldTransaction.walletId },
          data: { balanceInCents: { increment: balanceDelta } },
        });

        return await tx.transaction.update({
          where: { id: transactionId },
          data: {
            amountInCents: dto.amountInCents,
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
          include: { category: true },
        });

        if (!transaction) {
          throw new NotFoundException(
            `The transaction with id ${transactionId} not found`,
          );
        }

        const balanceDelta =
          transaction.category.type === TransactionType.EXPENSE
            ? transaction.amountInCents
            : -transaction.amountInCents;

        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balanceInCents: { increment: balanceDelta } },
        });

        return await tx.transaction.delete({
          where: { id: transaction.id },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async createNewTransfer(dto: CreateTransferDto) {
    if (dto.oldWalletId === dto.newWalletId) {
      throw new BadRequestException(
        'The oldWalletId and newWalletId should not be the same',
      );
    }
    return await this.kysely.transaction().execute(async (tx) => {
      const wallets = await tx
        .selectFrom('Wallet')
        .select(['id'])
        .where('id', 'in', [dto.oldWalletId, dto.newWalletId])
        .execute();

      const walletIds = new Set(wallets.map((w) => w.id));

      if (!walletIds.has(dto.oldWalletId)) {
        throw new NotFoundException(
          `The wallet with id ${dto.oldWalletId} not found`,
        );
      }

      if (!walletIds.has(dto.newWalletId)) {
        throw new NotFoundException(
          `The wallet with id ${dto.newWalletId} not found`,
        );
      }

      const result = await tx
        .updateTable('Wallet')
        .set((eb) => ({
          balanceInCents: eb('balanceInCents', '-', dto.amountInCents),
        }))
        .where('id', '=', dto.oldWalletId)
        .where('balanceInCents', '>=', dto.amountInCents)
        .executeTakeFirst();

      if (Number(result.numUpdatedRows) === 0) {
        throw new BadRequestException('Insufficient funds');
      }

      const transferGroupId = createId();

      const categoryExpenseTransfer = await tx
        .selectFrom('Category')
        .select('id')
        .where('type', '=', 'EXPENSE')
        .where('name', '=', 'Transfer')
        .executeTakeFirst();

      if (categoryExpenseTransfer) {
        await tx
          .insertInto('Transaction')
          .values({
            id: createId(),
            updatedAt: new Date(),
            categoryId: categoryExpenseTransfer.id,
            walletId: dto.oldWalletId,
            description: dto.description,
            amountInCents: dto.amountInCents,
            date: dto.date,
            transferGroupId: transferGroupId,
          })
          .execute();
      } else {
        throw new InternalServerErrorException(
          'No exception category for transfer',
        );
      }

      await tx
        .updateTable('Wallet')
        .set((eb) => ({
          balanceInCents: eb('balanceInCents', '+', dto.amountInCents),
        }))
        .where('id', '=', dto.newWalletId)
        .execute();

      const categoryIncomeTransfer = await tx
        .selectFrom('Category')
        .select('id')
        .where('type', '=', TransactionType.INCOME)
        .where('name', '=', 'Transfer')
        .executeTakeFirst();

      if (categoryIncomeTransfer) {
        await tx
          .insertInto('Transaction')
          .values({
            id: createId(),
            updatedAt: new Date(),
            categoryId: categoryIncomeTransfer.id,
            walletId: dto.newWalletId,
            description: dto.description,
            amountInCents: dto.amountInCents,
            date: dto.date,
            transferGroupId: transferGroupId,
          })
          .execute();
      } else {
        throw new InternalServerErrorException(
          'No income category for transfer',
        );
      }
    });
  }

  async updateTransfer(transferGroupId: string, dto: UpdateTransferDto) {
    return await this.kysely.transaction().execute(async (tx) => {
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

      if (
        dto.amountInCents !== undefined &&
        dto.amountInCents !== transactions[0].amountInCents
      ) {
        const delta = dto.amountInCents - transactions[0].amountInCents;
        for (const transaction of transactions) {
          if (transaction.type === TransactionType.EXPENSE) {
            const result = await tx
              .updateTable('Wallet')
              .set((eb) => ({
                balanceInCents: eb('balanceInCents', '-', delta),
              }))
              .where('id', '=', transaction.walletId)
              .where('balanceInCents', '>=', delta > 0 ? delta : 0)
              .executeTakeFirst();
          } else {
            const result = await tx
              .updateTable('Wallet')
              .set((eb) => ({
                balanceInCents: eb('balanceInCents', '+', delta),
              }))
              .where('id', '=', transaction.walletId)
              .where('balanceInCents', '>=', delta < 0 ? -delta : 0)
              .executeTakeFirst();
          }
        }
      }

      const updateData = {
        ...(dto.date !== undefined && {
          date: dto.date,
        }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.amountInCents !== undefined && {
          amountInCents: dto.amountInCents,
        }),
      };

      if (Object.keys(updateData).length > 0) {
        await tx
          .updateTable('Transaction')
          .set(updateData)
          .where('transferGroupId', '=', transferGroupId)
          .execute();
      }
    });
  }

  async deleteTransfer(transferGroupId: string) {
    return await this.kysely.transaction().execute(async (tx) => {
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

      for (const transaction of transactions) {
        if (transaction.type === TransactionType.EXPENSE) {
          await tx
            .updateTable('Wallet')
            .set((eb) => ({
              balanceInCents: eb(
                'balanceInCents',
                '+',
                transaction.amountInCents,
              ),
            }))
            .where('id', '=', transaction.walletId)
            .executeTakeFirst();
        } else {
          const result = await tx
            .updateTable('Wallet')
            .set((eb) => ({
              balanceInCents: eb(
                'balanceInCents',
                '-',
                transaction.amountInCents,
              ),
            }))
            .where('id', '=', transaction.walletId)
            .where('balanceInCents', '>=', transaction.amountInCents)
            .executeTakeFirst();
        }
      }

      await tx
        .deleteFrom('Transaction')
        .where('transferGroupId', '=', transferGroupId)
        .execute();
    });
  }
}
