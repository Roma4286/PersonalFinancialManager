import { TransactionType } from '@prisma/client';

class Category {
  readonly id!: string;
  readonly name!: string;
  readonly type!: TransactionType;
}

export class Transaction {
  readonly id!: string;
  readonly amount!: number;
  readonly date!: Date;
  readonly walletId!: string;
  readonly categoryId!: string;
}

export class TransactionWithCategory extends Transaction {
  readonly category!: Category;
}

export class AllWalletsWithAllTransactions {
  readonly id!: string;
  readonly name!: string;
  readonly balance!: number;
  readonly transactions!: TransactionWithCategory[];
}

export class BalanceResponse {
  readonly totalBalance!: number;
}
