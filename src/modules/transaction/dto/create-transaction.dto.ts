import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { IsAmountInCents } from '@/common/decorators/is-amount-in-cents.decorator';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTransactionDto {
  @IsAmountInCents()
  readonly amountInCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  readonly date?: string;

  @IsCuid()
  readonly walletId!: string;

  @IsCuid()
  readonly categoryId!: string;
}
