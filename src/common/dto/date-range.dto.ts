import { IsDateString, IsOptional } from 'class-validator';
import { IsAfterOrEqual } from '../decorators/is-after-or-equal.decorator';

export class DateRangeDto {
  @IsDateString()
  @IsOptional()
  readonly from?: string;

  @IsDateString()
  @IsOptional()
  @IsAfterOrEqual('from', { message: 'from must be <= to' })
  readonly to?: string;
}
