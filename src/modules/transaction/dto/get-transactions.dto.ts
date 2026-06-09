import { TransactionType } from '@/modules/category/dto/response-category.dto';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

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
  @Length(24, 24)
  readonly categoryId?: string;

  @IsString()
  @IsOptional()
  @Length(24, 24)
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
