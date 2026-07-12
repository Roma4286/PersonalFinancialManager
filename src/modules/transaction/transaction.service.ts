import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Transaction, TransactionType } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/get-transactions.dto';
import { WalletService } from '../wallet/wallet.service';
import { CategoryService } from '../category/category.service';

@Injectable()
export class TransactionService {
  DEFAULT_PAGE_SIZE = 100;
  MAX_PAGE_SIZE = 1000;
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private categoryService: CategoryService,
  ) {}

  async getTransactions(query: TransactionFilterDto) {
    if (query.from && query.to) {
      if (new Date(query.from) > new Date(query.to)) {
        throw new BadRequestException('from must be <= to');
      }
    }

    const page = query.page ?? 1;
    const length = Math.min(
      query.length ?? this.DEFAULT_PAGE_SIZE,
      this.MAX_PAGE_SIZE,
    );

    return await this.prisma.transaction.findMany({
      orderBy: {
        date: 'desc',
      },
      where: {
        ...(query.categoryId && { categoryId: query.categoryId }),
        ...(query.walletId && { walletId: query.walletId }),
        ...(query.transactionType && {
          category: {
            is: {
              type: query.transactionType,
            },
          },
        }),
        ...((query.from || query.to) && {
          date: {
            ...(query.from && { gte: new Date(query.from) }),
            ...(query.to && {
              lte: new Date(
                new Date(query.to).getTime() + 24 * 60 * 60 * 1000,
              ),
            }),
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
        await this.walletService.checkWallet(dto.walletId, tx);
        const category = await this.categoryService.findCategoryOrThrow(
          dto.categoryId,
          tx,
        );

        const signedAmountInCents =
          category.type === TransactionType.EXPENSE
            ? -dto.amountInCents
            : dto.amountInCents;

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
    );
  }

  async updateTransaction(transactionId: string, dto: UpdateTransactionDto) {
    return await this.prisma.$transaction(
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

        const category = await this.categoryService.findCategoryOrThrow(
          dto.categoryId,
          tx,
        );

        const newSignedAmountInCents =
          category.type === TransactionType.EXPENSE
            ? -dto.amountInCents
            : dto.amountInCents;

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
    );
  }
}
