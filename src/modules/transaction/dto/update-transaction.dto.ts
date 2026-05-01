import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amount!: number;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsString()
  readonly categoryId!: string;
}
