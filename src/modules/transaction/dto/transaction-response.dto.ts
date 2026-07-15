import { CategoryResponse } from '@/modules/category/dto/category-response.dto';
import { BaseEntityResponse } from '@/common/dto/base-entity-response.dto';
import { Expose, Type } from 'class-transformer';

export class TransactionResponse extends BaseEntityResponse {
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
