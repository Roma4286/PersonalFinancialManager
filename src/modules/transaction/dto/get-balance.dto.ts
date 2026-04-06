import { IsString } from 'class-validator';

export class GetBalanceDto {
  @IsString()
  readonly walletId!: string;
}
