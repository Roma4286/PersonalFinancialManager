import { TransactionType } from '@prisma/client';

class Category {
  readonly id!: string;
  readonly name!: string;
  readonly type!: TransactionType;
}

class TransactionWithCategory {
  readonly id!: string;
  readonly amount!: number;
  readonly date!: Date;
  readonly walletId!: string;
  readonly categoryId!: string;

  readonly category!: Category;
}

export class AllTransactions {
  readonly id!: string;
  readonly name!: string;
  readonly balance!: number;
  readonly transactions!: TransactionWithCategory[];
}

export class BalanceResponse {
  readonly totalBalance!: number;
}
