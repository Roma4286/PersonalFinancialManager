import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class TransactionFilterDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  readonly page?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  readonly length?: number;

  @IsString()
  @IsOptional()
  readonly categoryId?: string;

  @IsString()
  @IsOptional()
  readonly walletId?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  readonly transactionType?: TransactionType;

  @IsDateString()
  @IsOptional()
  readonly from?: string;

  @IsDateString()
  @IsOptional()
  readonly to?: string;
}
