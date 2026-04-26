import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTransactionDto {
  @IsString()
  readonly id!: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly newAmount!: number;

  @IsOptional()
  @IsString()
  readonly newDescription?: string;

  @IsString()
  readonly newCategoryId!: string;
}
