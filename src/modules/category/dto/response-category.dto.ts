import { TransactionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Category {
  @Expose() readonly id!: string;
  @Expose() readonly name!: string;

  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  @Expose()
  readonly type!: TransactionType;

  @Expose() readonly createdAt!: Date;
  @Expose() readonly updatedAt!: Date;
}
