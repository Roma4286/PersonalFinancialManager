import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  Category,
  Prisma,
  Transaction,
  TransactionType,
  Wallet,
} from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/get-transactions.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async getAllWallets(): Promise<Wallet[]> {
    return await this.prisma.wallet.findMany();
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany();
  }

  async getAllTransactions(filters: TransactionFilterDto) {
    const page = filters.page ?? 1;
    const length = Math.min(filters.length ?? 100, 1000);

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
            ...(filters.to && { lte: new Date(filters.to + 'T23:59:59.999Z') }),
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
        `The tansaction with id ${transactionId} not found`,
      );
    }

    return transaction;
  }

  async getBalance(walletId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: {
        balance: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException(`The wallet with id ${walletId} not found`);
    }

    return Number(wallet.balance);
  }

  validateSufficientFunds(wallet: Wallet, amount: Prisma.Decimal) {
    if (wallet.balance.plus(amount).isNegative()) {
      throw new BadRequestException('Insufficient funds');
    }
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

        this.validateSufficientFunds(wallet, balanceDelta);

        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { increment: balanceDelta } },
        });

        return await tx.transaction.create({
          data: {
            amount: dto.amount,
            description: dto.description ?? null,
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
        this.validateSufficientFunds(wallet, balanceDelta);

        await tx.wallet.update({
          where: { id: oldTransaction.walletId },
          data: { balance: { increment: balanceDelta } },
        });

        return await tx.transaction.update({
          where: { id: transactionId },
          data: {
            amount: dto.amount,
            description: dto.description ?? null,
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

        if (category) {
          const balanceDelta = new Prisma.Decimal(
            category.type === TransactionType.EXPENSE
              ? transaction.amount
              : transaction.amount.neg(),
          );

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
}
