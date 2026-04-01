import { TransactionType } from '../transaction.entity';

class Category {
  readonly id!: number;
  readonly name!: string;
  readonly type!: TransactionType;
}

class TransactionWithCategory {
  readonly id!: number;
  readonly amount!: number;
  readonly date!: Date;
  readonly walletId!: number;
  readonly categoryId!: number;

  readonly category!: Category;
}

export class AllTransactions {
  readonly id!: number;
  readonly name!: string;
  readonly balance!: number;
  readonly transactions!: TransactionWithCategory[];
}

export class BalanceResponse {
  readonly totalBalance!: number;
}
