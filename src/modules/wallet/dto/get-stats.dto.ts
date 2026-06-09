import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class StatsFiltersDto {
  @IsString()
  @IsNotEmpty()
  @Length(24, 24)
  readonly walletId!: string;

  @IsDateString()
  @IsOptional()
  readonly from?: string;

  @IsDateString()
  @IsOptional()
  readonly to?: string;
}
