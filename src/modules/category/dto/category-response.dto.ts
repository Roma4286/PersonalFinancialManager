import { TransactionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseEntityResponse } from '@/common/dto/base-entity-response.dto';

export class CategoryResponse extends BaseEntityResponse {
  @Expose() readonly name!: string;

  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  @Expose()
  readonly type!: TransactionType;
}
