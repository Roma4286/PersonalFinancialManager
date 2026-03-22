import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { TransactionType } from '../transaction.entity';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0, { message: 'Amount must be > 0' })
  readonly amount!: number;

  @IsString()
  readonly category!: string;

  @IsEnum(TransactionType)
  readonly type!: TransactionType;
}
