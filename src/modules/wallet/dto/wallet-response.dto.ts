import { TransactionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseEntityResponse } from '@/common/dto/base-entity-response.dto';

export class WalletResponse extends BaseEntityResponse {
  @Expose() readonly name!: string;
  @Expose() readonly balanceInCents!: number;
}

export class BalanceResponse {
  @Expose() readonly totalBalanceInCents!: number;
}

export class StatsResponse {
  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  @Expose()
  readonly type!: TransactionType;

  @Expose() readonly name!: string;
  @Expose() readonly totalAmountInCents!: string;
}
