import { Category } from '@/modules/category/dto/response-category.dto';
import { Expose, Type } from 'class-transformer';

export class Transaction {
  @Expose() readonly id!: string;
  @Expose() readonly amountInCents!: number;
  @Expose() readonly description!: string | null;
  @Expose() readonly date!: Date;
  @Expose() readonly walletId!: string;
  @Expose() readonly categoryId!: string;
  @Expose() readonly createdAt!: Date;
  @Expose() readonly updatedAt!: Date;
}

export class TransactionWithCategory extends Transaction {
  @Expose()
  @Type(() => Category)
  readonly category!: Category;
}
