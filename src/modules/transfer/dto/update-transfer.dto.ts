import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTransferDto {
  @IsInt()
  @IsOptional()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amountInCents?: number;

  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;
}
