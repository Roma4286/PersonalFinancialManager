import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { IsAmountInCents } from '@/common/decorators/is-amount-in-cents.decorator';
import { IsDescription } from '@/common/decorators/is-description.decorator';
import { IsDateString, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsAmountInCents()
  readonly amountInCents!: number;

  @IsDescription()
  readonly description?: string;

  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @IsCuid()
  readonly walletId!: string;

  @IsCuid()
  readonly categoryId!: string;
}
