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
