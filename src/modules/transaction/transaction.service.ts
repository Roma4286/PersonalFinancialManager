import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Transaction, TransactionType } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { StatsFilterDto } from './dto/stats-filter.dto';
import { WalletService } from '../wallet/wallet.service';
import { CategoryService } from '../category/category.service';
import { withSerializableRetry } from '@/common/utils/with-serializable-retry';

@Injectable()
export class TransactionService {
  private readonly DEFAULT_PAGE_SIZE = 100;
  private readonly MAX_PAGE_SIZE = 1000;
  private readonly ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private categoryService: CategoryService,
  ) {}

  private signAmount(type: TransactionType, amountInCents: number): number {
    return type === TransactionType.EXPENSE ? -amountInCents : amountInCents;
  }

  async getTransactions(query: TransactionFilterDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? this.DEFAULT_PAGE_SIZE,
      this.MAX_PAGE_SIZE,
    );

    return await this.prisma.transaction.findMany({
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      where: {
        ...(query.categoryId && { categoryId: query.categoryId }),
        ...(query.walletId && { walletId: query.walletId }),
        ...(query.type && {
          category: {
            is: {
              type: query.type,
            },
          },
        }),
        ...((query.from || query.to) && {
          date: {
            ...(query.from && { gte: new Date(query.from) }),
            ...(query.to && {
              lte: new Date(new Date(query.to).getTime() + this.ONE_DAY_IN_MS),
            }),
          },
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    return await withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          await this.walletService.checkWallet(dto.walletId, tx);

          if (!this.categoryService.isNotReserved(dto.categoryId)) {
            throw new BadRequestException('categoryId must be a valid id');
          }

          const category = await this.categoryService.findCategoryOrThrow(
            dto.categoryId,
            tx,
          );

          const signedAmountInCents = this.signAmount(
            category.type,
            dto.amountInCents,
          );

          await this.walletService.updateBalance(
            dto.walletId,
            signedAmountInCents,
            tx,
          );

          return await tx.transaction.create({
            data: {
              amountInCents: signedAmountInCents,
              description: dto.description,
              ...(dto.date && { date: new Date(dto.date) }),
              walletId: dto.walletId,
              categoryId: dto.categoryId,
            },
          });
        },
        { isolationLevel: 'Serializable' },
      ),
    );
  }

  async updateTransaction(transactionId: string, dto: UpdateTransactionDto) {
    return await withSerializableRetry(() =>
      this.prisma.$transaction(
        async (tx) => {
          const oldTransaction = await tx.transaction.findUnique({
            where: { id: transactionId },
          });

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

          const categoryId = dto.categoryId ?? oldTransaction.categoryId;

          if (!this.categoryService.isNotReserved(categoryId)) {
            throw new BadRequestException('categoryId must be a valid id');
          }

          const category = await this.categoryService.findCategoryOrThrow(
            categoryId,
            tx,
          );

          const rawAmountInCents =
            dto.amountInCents ?? Math.abs(oldTransaction.amountInCents);

          const newSignedAmountInCents = this.signAmount(
            category.type,
            rawAmountInCents,
          );

          const balanceDelta =
            newSignedAmountInCents - oldTransaction.amountInCents;

          await this.walletService.updateBalance(
            oldTransaction.walletId,
            balanceDelta,
            tx,
          );

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
      ),
    );
  }

  async getStats(query: StatsFilterDto) {
    await this.walletService.checkWallet(query.walletId);

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        walletId: query.walletId,
        transferGroupId: null,
        ...((query.from || query.to) && {
          date: {
            ...(query.from && { gte: new Date(query.from) }),
            ...(query.to && {
              lte: new Date(
                new Date(query.to).getTime() + this.ONE_DAY_IN_MS,
              ),
            }),
          },
        }),
      },
      _sum: { amountInCents: true },
    });

    const categories = await this.prisma.category.findMany({
      where: { id: { in: grouped.map((group) => group.categoryId) } },
    });
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    return grouped.map((group) => {
      const category = categoryById.get(group.categoryId)!;

      return {
        name: category.name,
        type: category.type,
        totalAmountInCents: String(Math.abs(group._sum.amountInCents ?? 0)),
      };
    });
  }

  async deleteTransaction(transactionId: string): Promise<Transaction> {
    return await withSerializableRetry(() =>
      this.prisma.$transaction(
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

          await this.walletService.updateBalance(
            transaction.walletId,
            -transaction.amountInCents,
            tx,
          );

          return await tx.transaction.delete({
            where: { id: transaction.id },
          });
        },
        { isolationLevel: 'Serializable' },
      ),
    );
  }
}
