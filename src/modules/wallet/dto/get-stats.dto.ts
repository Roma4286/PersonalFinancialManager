import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { IsDateString, IsOptional } from 'class-validator';

export class StatsFiltersDto {
  @IsCuid()
  readonly walletId!: string;

  @IsDateString()
  @IsOptional()
  readonly from?: string;

  @IsDateString()
  @IsOptional()
  readonly to?: string;
}
