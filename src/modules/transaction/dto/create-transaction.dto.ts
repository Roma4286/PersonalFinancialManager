import { IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';
import { TransactionType } from '../transaction.entity';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amount!: number;

  @IsString()
  readonly category!: string;

  @IsEnum(TransactionType)
  readonly type!: TransactionType;
}
