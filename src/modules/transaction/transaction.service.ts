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

@Injectable()
export class TransactionService {
  DEFAULT_PAGE_SIZE = 100;
  MAX_PAGE_SIZE = 1000;
  constructor(private prisma: PrismaService) {}

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
}
