import { IsDateString, IsNotEmpty, IsString, Length } from 'class-validator';

export class StatsFiltersDto {
  @IsString()
  @IsNotEmpty()
  @Length(24, 24)
  readonly walletId!: string;

  @IsDateString()
  readonly from!: string;

  @IsDateString()
  readonly to!: string;
}
