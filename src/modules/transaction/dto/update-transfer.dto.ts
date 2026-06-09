import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTransferDto {
  @IsNumber()
  @IsOptional()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amount?: number;

  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;
}
