import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTransferDto {
  @IsCuid()
  readonly fromWalletId!: string;

  @IsCuid()
  readonly toWalletId!: string;

  @IsInt()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amountInCents!: number;

  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;
}
