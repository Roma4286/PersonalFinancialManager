export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class Transaction {
  id!: number;
  amount!: number;
  date!: Date;
  walletId!: number;
  categoryId!: number;
}
