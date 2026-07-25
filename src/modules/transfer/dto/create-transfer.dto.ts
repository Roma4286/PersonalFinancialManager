import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { IsAmountInCents } from '@/common/decorators/is-amount-in-cents.decorator';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTransferDto {
  @IsCuid()
  readonly fromWalletId!: string;

  @IsCuid()
  readonly toWalletId!: string;

  @IsAmountInCents()
  readonly amountInCents!: number;

  @IsOptional()
  @IsDateString({ strict: true })
  readonly date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;
}
