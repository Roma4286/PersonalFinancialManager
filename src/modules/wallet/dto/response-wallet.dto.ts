import { TransactionType } from '@/modules/category/dto/response-category.dto';

export class Wallet {
  readonly id!: string;
  readonly name!: string;
  readonly balance!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export class BalanceResponse {
  readonly totalBalance!: string;
}

export class StatsResponse {
  readonly type!: TransactionType;
  readonly name!: string;
  readonly totalAmount!: string;
}
