export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: number;
  amount: number;
  date: Date;
  category: string;
  type: TransactionType;
};
