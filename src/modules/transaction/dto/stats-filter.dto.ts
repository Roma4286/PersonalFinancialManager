import { IsCuid } from '@/common/decorators/is-cuid.decorator';
import { DateRangeDto } from '@/common/dto/date-range.dto';

export class StatsFilterDto extends DateRangeDto {
  @IsCuid()
  readonly walletId!: string;
}
