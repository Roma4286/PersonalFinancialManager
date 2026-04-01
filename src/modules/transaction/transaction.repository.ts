import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Transaction, TransactionType } from './transaction.entity';

@Injectable()
export class TransactionRepository {
  constructor(private prisma: PrismaService) {}

  async getWalletById(id: number) {
    return await this.prisma.wallets.findUnique({
      where: {
        id: id,
      },
    });
  }

  async getCategoryById(id: number) {
    return await this.prisma.categories.findUnique({
      where: {
        id: id,
      },
    });
  }

  async getTransactionById(id: number) {
    return await this.prisma.transactions.findUnique({
      where: {
        id: id,
      },
    });
  }

  async getTransactionsByType(walletId: number, type: string) {
    return await this.prisma.transactions.findMany({
      where: {
        category: {
          type: type,
        },
        walletId: walletId,
      },
    });
  }

  async getAllTransactions() {
    return await this.prisma.wallets.findMany({
      include: {
        transactions: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async changeBalance(walletId: number, balanceDelta: number) {
    await this.prisma.wallets.update({
      where: { id: walletId },
      data: {
        balance: {
          increment: balanceDelta,
        },
      },
    });
  }

  async createNewTransaction(data: CreateTransactionDto) {
    const category = await this.getCategoryById(data.categoryId);

    let balanceDelta = 0;

    if (category) {
      balanceDelta =
        (category.type as TransactionType) === TransactionType.EXPENSE
          ? -data.amount
          : data.amount;
    }

    await this.changeBalance(data.walletId, balanceDelta);

    return await this.prisma.transactions.create({
      data: {
        amount: data.amount,
        date: new Date(),
        walletId: data.walletId,
        categoryId: data.categoryId,
      },
    });
  }

  async deleteTransactionById(transaction: Transaction) {
    const category = await this.getCategoryById(transaction.categoryId);

    let balanceDelta = 0;

    if (category) {
      balanceDelta =
        (category.type as TransactionType) === TransactionType.EXPENSE
          ? transaction.amount
          : -transaction.amount;
    }

    await this.changeBalance(transaction.walletId, balanceDelta);

    return await this.prisma.transactions.delete({
      where: { id: transaction.id },
    });
  }
}
