import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Transaction, TransactionType } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/get-transactions.dto';
import { WalletService } from '../wallet/wallet.service';
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
    private walletService: WalletService,
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

        const balanceDelta = new Prisma.Decimal(
          category.type === TransactionType.EXPENSE ? -dto.amount : dto.amount,
        );

        this.walletService.validateSufficientFunds(wallet, balanceDelta);

        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { increment: balanceDelta } },
        });

        const date = dto.date ? new Date(dto.date) : new Date();

        return await tx.transaction.create({
          data: {
            amount: dto.amount,
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
        const oldTransaction = await tx.transaction.findUnique({
          where: {
            id: transactionId,
          },
        });

        if (!oldTransaction) {
          throw new NotFoundException(
            `The transaction with id ${transactionId} not found`,
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

        const oldCategory = await tx.category.findUnique({
          where: {
            id: oldTransaction.categoryId,
          },
        });

        if (!oldCategory) {
          throw new NotFoundException(
            `The category to which this transaction belongs cannot be found`,
          );
        }

        const wallet = await tx.wallet.findUnique({
          where: {
            id: oldTransaction.walletId,
          },
        });

        if (!wallet) {
          throw new NotFoundException(
            `The wallet to which this transaction belongs cannot be found`,
          );
        }

        const oldEffect =
          oldCategory.type === TransactionType.EXPENSE
            ? oldTransaction.amount
            : oldTransaction.amount.neg();

        const newEffect =
          category.type === TransactionType.EXPENSE
            ? new Prisma.Decimal(dto.amount).neg()
            : new Prisma.Decimal(dto.amount);

        const balanceDelta = oldEffect.plus(newEffect);
        this.walletService.validateSufficientFunds(wallet, balanceDelta);

        await tx.wallet.update({
          where: { id: oldTransaction.walletId },
          data: { balance: { increment: balanceDelta } },
        });

        return await tx.transaction.update({
          where: { id: transactionId },
          data: {
            amount: dto.amount,
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

        const category = await tx.category.findUnique({
          where: { id: transaction.categoryId },
        });

        const wallet = await tx.wallet.findUnique({
          where: { id: transaction.walletId },
        });

        if (category && wallet) {
          const balanceDelta = new Prisma.Decimal(
            category.type === TransactionType.EXPENSE
              ? transaction.amount
              : transaction.amount.neg(),
          );

          this.walletService.validateSufficientFunds(wallet, balanceDelta);

          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: balanceDelta } },
          });
        }

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
          balance: eb('balance', '-', dto.amount.toString()),
        }))
        .where('id', '=', dto.oldWalletId)
        .where('balance', '>=', dto.amount.toString())
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
            amount: dto.amount,
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
          balance: eb('balance', '+', dto.amount.toString()),
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
            amount: dto.amount,
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
          'Transaction.amount',
          'Category.type',
        ])
        .where('transferGroupId', '=', transferGroupId)
        .execute();

      if (transactions.length !== 2) {
        throw new NotFoundException(`Transfer ${transferGroupId} not found`);
      }

      if (
        dto.amount !== undefined &&
        dto.amount !== Number(transactions[0].amount)
      ) {
        const delta = dto.amount - Number(transactions[0].amount);
        for (const transaction of transactions) {
          if (transaction.type === TransactionType.EXPENSE) {
            const result = await tx
              .updateTable('Wallet')
              .set((eb) => ({
                balance: eb('balance', '-', delta.toString()),
              }))
              .where('id', '=', transaction.walletId)
              .where('balance', '>=', delta > 0 ? delta.toString() : '0')
              .executeTakeFirst();

            if (delta > 0 && Number(result.numUpdatedRows) === 0) {
              throw new BadRequestException('Insufficient funds');
            }
          } else {
            const result = await tx
              .updateTable('Wallet')
              .set((eb) => ({
                balance: eb('balance', '+', delta.toString()),
              }))
              .where('id', '=', transaction.walletId)
              .where('balance', '>=', delta < 0 ? (-delta).toString() : '0')
              .executeTakeFirst();

            if (Number(result.numUpdatedRows) === 0) {
              throw new BadRequestException(
                'Insufficient funds to rollback transfer',
              );
            }
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
        ...(dto.amount !== undefined && {
          amount: dto.amount,
        }),
      };

      await tx
        .updateTable('Transaction')
        .set(updateData)
        .where('transferGroupId', '=', transferGroupId)
        .execute();
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
          'Transaction.amount',
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
              balance: eb('balance', '+', transaction.amount),
            }))
            .where('id', '=', transaction.walletId)
            .executeTakeFirst();
        } else {
          const result = await tx
            .updateTable('Wallet')
            .set((eb) => ({
              balance: eb('balance', '-', transaction.amount),
            }))
            .where('id', '=', transaction.walletId)
            .where('balance', '>=', transaction.amount)
            .executeTakeFirst();

          if (Number(result.numUpdatedRows) === 0) {
            throw new BadRequestException(
              'Insufficient funds to rollback transfer',
            );
          }
        }
      }

      await tx
        .deleteFrom('Transaction')
        .where('transferGroupId', '=', transferGroupId)
        .execute();
    });
  }
}
