import { Expose } from 'class-transformer';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class Category {
  @Expose() readonly id!: string;
  @Expose() readonly name!: string;
  @Expose() readonly type!: TransactionType;
  @Expose() readonly createdAt!: Date;
  @Expose() readonly updatedAt!: Date;
}
