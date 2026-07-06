import { IsCuid } from '@/common/decorators/is-cuid.decorator';

export class TransferGroupIdParamDto {
  @IsCuid()
  readonly transferGroupId!: string;
}
