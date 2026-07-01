import { IsCuid } from '@/common/decorators/is-cuid.decorator';

export class GetBalanceDto {
  @IsCuid()
  readonly id!: string;
}
