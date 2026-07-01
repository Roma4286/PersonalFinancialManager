import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amountInCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @IsCuid()
  readonly walletId!: string;

  @IsCuid()
  readonly categoryId!: string;
}
