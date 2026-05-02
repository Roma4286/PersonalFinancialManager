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
  readonly amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @IsString()
  readonly walletId!: string;

  @IsString()
  readonly categoryId!: string;
}
