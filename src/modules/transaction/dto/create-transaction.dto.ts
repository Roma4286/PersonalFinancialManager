import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amount!: number;

  @IsString()
  readonly walletId!: string;

  @IsString()
  readonly categoryId!: string;
}
