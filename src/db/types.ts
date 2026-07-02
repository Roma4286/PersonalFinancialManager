import type { ColumnType } from 'kysely';
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];
export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Transaction = {
  id: string;
  amountInCents: number;
  description: string | null;
  date: Generated<Timestamp>;
  transferGroupId: string | null;
  walletId: string;
  categoryId: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Wallet = {
  id: string;
  name: string;
  balanceInCents: Generated<number>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type DB = {
  Category: Category;
  Transaction: Transaction;
  Wallet: Wallet;
};
