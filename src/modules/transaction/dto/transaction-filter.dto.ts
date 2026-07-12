import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { TransactionType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { DateRangeDto } from '@/common/dto/date-range.dto';

export class TransactionFilterDto extends DateRangeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly pageSize?: number;

  @IsOptional()
  @IsCuid()
  readonly categoryId?: string;

  @IsOptional()
  @IsCuid()
  readonly walletId?: string;

  @ApiPropertyOptional({ enum: TransactionType, enumName: 'TransactionType' })
  @IsEnum(TransactionType)
  @IsOptional()
  readonly type?: TransactionType;
}
