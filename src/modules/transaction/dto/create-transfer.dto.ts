import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTransferDto {
  @IsCuid()
  readonly oldWalletId!: string;

  @IsCuid()
  readonly newWalletId!: string;

  @IsNumber()
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
