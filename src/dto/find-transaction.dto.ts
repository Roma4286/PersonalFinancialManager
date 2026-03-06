import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class FindTransactionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'id must be greater than or equal to 0' })
  id: number;
}
