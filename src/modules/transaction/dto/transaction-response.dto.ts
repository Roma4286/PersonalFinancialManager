enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class Category {
  readonly id!: string;
  readonly name!: string;
  readonly type!: TransactionType;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export class Wallet {
  readonly id!: string;
  readonly name!: string;
  readonly balance!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export class Transaction {
  readonly id!: string;
  readonly amount!: number;
  readonly description!: string | null;
  readonly date!: Date;
  readonly walletId!: string;
  readonly categoryId!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
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
