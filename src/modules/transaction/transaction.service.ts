import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Category, Transaction, TransactionType } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { StatsFilterDto } from './dto/stats-filter.dto';
import { WalletService } from '../wallet/wallet.service';
import { CategoryService } from '../category/category.service';
import { KyselyService } from '../kysely/kysely.service';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class TransactionService {
  private readonly DEFAULT_PAGE_SIZE = 100;
  private readonly MAX_PAGE_SIZE = 1000;
  private readonly ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
  constructor(
    private kysely: KyselyService,
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

    return await this.kysely
      .selectFrom('Transaction')
      .innerJoin('Category', 'Category.id', 'Transaction.categoryId')
      .selectAll('Transaction')
      .$if(!!query.categoryId, (qb) =>
        qb.where('Transaction.categoryId', '=', query.categoryId!),
      )
      .$if(!!query.walletId, (qb) =>
        qb.where('Transaction.walletId', '=', query.walletId!),
      )
      .$if(!!query.type, (qb) => qb.where('Category.type', '=', query.type!))
      .$if(!!query.from, (qb) =>
        qb.where('Transaction.date', '>=', new Date(query.from!)),
      )
      .$if(!!query.to, (qb) =>
        qb.where(
          'Transaction.date',
          '<=',
          new Date(new Date(query.to!).getTime() + this.ONE_DAY_IN_MS),
        ),
      )
      .orderBy('Transaction.date', 'desc')
      .orderBy('Transaction.id', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();
  }

  async getTransactionById(
    transactionId: string,
  ): Promise<Transaction & { category: Category }> {
    const transaction = await this.kysely
      .selectFrom('Transaction')
      .selectAll()
      .where('id', '=', transactionId)
      .executeTakeFirst();

    if (!transaction) {
      throw new NotFoundException(
        `The transaction with id ${transactionId} not found`,
      );
    }

    const category = await this.categoryService.findCategoryOrThrow(
      transaction.categoryId,
    );

    return { ...transaction, category };
  }

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    return await this.kysely
      .transaction()
      .setIsolationLevel('serializable')
      .execute(async (tx) => {
        await this.walletService.findWalletOrThrow(dto.walletId, tx);

        if (this.categoryService.isReserved(dto.categoryId)) {
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

        const now = new Date();

        await this.walletService.updateBalance(
          dto.walletId,
          signedAmountInCents,
          tx,
          now,
        );

        return await tx
          .insertInto('Transaction')
          .values({
            id: createId(),
            amountInCents: signedAmountInCents,
            description: dto.description,
            ...(dto.date && { date: new Date(dto.date) }),
            walletId: dto.walletId,
            categoryId: dto.categoryId,
            updatedAt: now,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      });
  }

  async updateTransaction(
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return await this.kysely
      .transaction()
      .setIsolationLevel('serializable')
      .execute(async (tx) => {
        const oldTransaction = await tx
          .selectFrom('Transaction')
          .selectAll()
          .where('id', '=', transactionId)
          .executeTakeFirst();

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

        if (this.categoryService.isReserved(categoryId)) {
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

        const now = new Date();

        await this.walletService.updateBalance(
          oldTransaction.walletId,
          balanceDelta,
          tx,
          now,
        );

        return await tx
          .updateTable('Transaction')
          .set({
            amountInCents: newSignedAmountInCents,
            updatedAt: now,
            ...(dto.description !== undefined && {
              description: dto.description,
            }),
            ...(dto.date !== undefined && { date: new Date(dto.date) }),
            ...(dto.categoryId !== undefined && {
              categoryId: dto.categoryId,
            }),
          })
          .where('id', '=', transactionId)
          .returningAll()
          .executeTakeFirstOrThrow();
      });
  }

  async getStats(query: StatsFilterDto) {
    await this.walletService.findWalletOrThrow(query.walletId);

    const grouped = await this.kysely
      .selectFrom('Transaction')
      .select([
        'categoryId',
        (eb) => eb.fn.sum<string>('amountInCents').as('totalAmountInCents'),
      ])
      .where('walletId', '=', query.walletId)
      .where('transferGroupId', 'is', null)
      .$if(!!query.from, (qb) => qb.where('date', '>=', new Date(query.from!)))
      .$if(!!query.to, (qb) =>
        qb.where(
          'date',
          '<=',
          new Date(new Date(query.to!).getTime() + this.ONE_DAY_IN_MS),
        ),
      )
      .groupBy('categoryId')
      .execute();

    const categories = await this.kysely
      .selectFrom('Category')
      .selectAll()
      .where(
        'id',
        'in',
        grouped.map((group) => group.categoryId),
      )
      .execute();

    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    return grouped.map((group) => {
      const category = categoryById.get(group.categoryId)!;

      return {
        name: category.name,
        type: category.type,
        totalAmountInCents: Math.abs(Number(group.totalAmountInCents ?? 0)),
      };
    });
  }

  async deleteTransaction(transactionId: string): Promise<Transaction> {
    return await this.kysely
      .transaction()
      .setIsolationLevel('serializable')
      .execute(async (tx) => {
        const transaction = await tx
          .selectFrom('Transaction')
          .selectAll()
          .where('id', '=', transactionId)
          .executeTakeFirst();

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

        return await tx
          .deleteFrom('Transaction')
          .where('id', '=', transaction.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      });
  }
}
