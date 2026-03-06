export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class TransactionResponse {
  id: number;
  amount: number;
  date: Date;
  category: string;
  type: TransactionType;
}

export class BalanceResponse {
  totalBalance: string;
}
