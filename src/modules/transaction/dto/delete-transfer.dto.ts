import { IsCuid } from '@/common/decorators/is-cuid.decorator';

export class DeleteTransferDto {
  @IsCuid()
  readonly transferGroupId!: string;
}
