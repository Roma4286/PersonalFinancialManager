import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class CreateTransactionDto {
  @IsNumber()
  @Min(0, { message: 'Amount must be > 0' })
  readonly amount: number;

  @IsString()
  readonly category: string;

  @IsEnum(TransactionType)
  readonly type: TransactionType;
}
