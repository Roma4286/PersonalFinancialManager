import { CategoryResponse } from '@/modules/category/dto/category-response.dto';
import { BaseEntityWithTimestampsResponse } from '@/common/dto/base-entity-response.dto';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class TransactionResponse extends BaseEntityWithTimestampsResponse {
  @Expose() readonly amountInCents!: number;
  @Expose() readonly description!: string | null;
  @Expose() readonly date!: Date;
  @Expose() readonly walletId!: string;
  @Expose() readonly categoryId!: string;
  @Expose() readonly transferGroupId?: string | null;
}

export class TransactionWithCategoryResponse extends TransactionResponse {
  @Expose()
  @Type(() => CategoryResponse)
  readonly category!: CategoryResponse;
}

export class StatsResponse {
  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  @Expose()
  readonly type!: TransactionType;

  @Expose() readonly name!: string;
  @Expose() readonly totalAmountInCents!: number;
}
