import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private prisma: PrismaService) {}

  async getTransactions() {
    return await this.prisma.categories.findMany({
      include: {
        transaction: true,
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

  async getTransactionsByType(type: string) {
    return await this.prisma.transactions.findMany({
      where: {
        category: {
          type: type, // фильтр по типу категории
        },
      },
    });
  }

  async deleteTransactionById(id: number) {
    const transaction = await this.prisma.transactions.findUnique({
      where: {
        id: id,
      },
    });
    if (transaction) {
      return await this.prisma.transactions.delete({
        where: { id },
      });
    }
    return null;
  }

  async createNewTransaction(dto: CreateTransactionDto) {
    const category = await this.prisma.categories.findUnique({
      where: { id: dto.categoryId },
    });

    if (category) {
      return await this.prisma.transactions.create({
        data: {
          amount: dto.amount,
          date: new Date(),
          categoryId: dto.categoryId,
        },
      });
    }
  }
}
