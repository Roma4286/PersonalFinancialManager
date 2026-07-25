import { IsOptional } from 'class-validator';
import { IsAfterOrEqual } from '../decorators/is-after-or-equal.decorator';
import { IsDateOnly } from '../decorators/is-date-only.decorator';

export class DateRangeDto {
  @IsDateOnly()
  @IsOptional()
  readonly from?: string;

  @IsDateOnly()
  @IsOptional()
  @IsAfterOrEqual('from', { message: 'from must be <= to' })
  readonly to?: string;
}
