import { TransactionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  @Expose()
  readonly type!: TransactionType;

  @Expose() readonly name!: string;
  @Expose() readonly totalAmount!: string;
}
