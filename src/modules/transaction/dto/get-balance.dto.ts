import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class GetBalanceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Id must be greater than or equal to 1' })
  readonly walletId!: number;
}
