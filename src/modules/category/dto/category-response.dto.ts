import { TransactionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseEntityWithTimestampsResponse  } from '@/common/dto/base-entity-response.dto';

export class CategoryResponse extends BaseEntityWithTimestampsResponse  {
  @Expose() readonly name!: string;

  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  @Expose()
  readonly type!: TransactionType;
}
