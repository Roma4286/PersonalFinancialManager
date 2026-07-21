import { Expose } from 'class-transformer';
import { BaseEntityWithTimestampsResponse  } from '@/common/dto/base-entity-response.dto';

export class WalletResponse extends BaseEntityWithTimestampsResponse  {
  @Expose() readonly name!: string;
  @Expose() readonly balanceInCents!: number;
}

export class BalanceResponse {
  @Expose() readonly totalBalanceInCents!: number;
}
