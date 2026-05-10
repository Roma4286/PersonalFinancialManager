import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  @Length(24, 24)
  readonly oldWalletId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(24, 24)
  readonly newWalletId!: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be > 0' })
  readonly amount!: number;

  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;
}
