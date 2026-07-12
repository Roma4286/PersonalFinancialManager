import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { DateRangeDto } from '@/common/dto/date-range.dto';

export class StatsFiltersDto extends DateRangeDto {
  @IsCuid()
  readonly walletId!: string;
}
