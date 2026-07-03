import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { TransactionType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class TransactionFilterDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly length?: number;

  @IsOptional()
  @IsCuid()
  readonly categoryId?: string;

  @IsOptional()
  @IsCuid()
  readonly walletId?: string;

  @ApiPropertyOptional({ enum: TransactionType, enumName: 'TransactionType' })
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
