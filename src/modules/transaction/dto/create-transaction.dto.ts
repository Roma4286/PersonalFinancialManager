import { IsNumber, IsPositive } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amount!: number;

  @IsNumber()
  readonly categoryId!: number;
}
