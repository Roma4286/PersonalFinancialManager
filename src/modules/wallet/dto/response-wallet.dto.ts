import { TransactionType } from '@/modules/category/dto/response-category.dto';
import { Expose } from 'class-transformer';

export class Wallet {
  @Expose() readonly id!: string;
  @Expose() readonly name!: string;
  @Expose() readonly balanceInCents!: number;
  @Expose() readonly createdAt!: Date;
  @Expose() readonly updatedAt!: Date;
}

export class BalanceResponse {
  @Expose() readonly totalBalance!: string;
}

export class StatsResponse {
  @Expose() readonly type!: TransactionType;
  @Expose() readonly name!: string;
  @Expose() readonly totalAmount!: string;
}
