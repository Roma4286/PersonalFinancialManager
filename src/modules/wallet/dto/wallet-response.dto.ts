import { Expose } from 'class-transformer';
import { BaseEntityResponse } from '@/common/dto/base-entity-response.dto';

export class WalletResponse extends BaseEntityResponse {
  @Expose() readonly name!: string;
  @Expose() readonly balanceInCents!: number;
}

export class BalanceResponse {
  @Expose() readonly totalBalanceInCents!: number;
}
