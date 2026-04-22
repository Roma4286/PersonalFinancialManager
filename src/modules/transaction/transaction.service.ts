import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import {
  AllWalletsWithAllTransactions,
  Transaction,
} from './dto/transaction-response.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async getAllTransactions(): Promise<AllWalletsWithAllTransactions[]> {
    return await this.prisma.wallet.findMany({
      include: {
        transactions: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`,
      );
    }

    return transaction;
  }

  async getBalance(walletId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${walletId} not found`);
    }

    return wallet.balance;
  }

  async createNewTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: dto.walletId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with id ${dto.walletId} not found`);
      }

      const category = await tx.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} not found`,
        );
      }

      const balanceDelta =
        category.type === TransactionType.EXPENSE ? -dto.amount : dto.amount;

      if (wallet.balance + balanceDelta < 0) {
        throw new BadRequestException('Insufficient funds');
      }

      await tx.wallet.update({
        where: { id: dto.walletId },
        data: { balance: { increment: balanceDelta } },
      });

      return await tx.transaction.create({
        data: {
          amount: dto.amount,
          walletId: dto.walletId,
          categoryId: dto.categoryId,
        },
      });
    });
  }

  async deleteTransaction(transactionId: string): Promise<Transaction> {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException(
          `Transaction with id ${transactionId} not found`,
        );
      }

      const category = await tx.category.findUnique({
        where: { id: transaction.categoryId },
      });

      let balanceDelta = 0;

      if (category) {
        balanceDelta =
          category.type === TransactionType.EXPENSE
            ? transaction.amount
            : -transaction.amount;
      }

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: balanceDelta } },
      });

      return await tx.transaction.delete({
        where: { id: transaction.id },
      });
    });
  }
}
