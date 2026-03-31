import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amount!: number;

  @IsNumber()
  @Min(1, { message: 'Category id must be greater than or equal to 1' })
  readonly categoryId!: number;
}
