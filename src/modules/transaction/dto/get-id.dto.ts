import { IsCuid } from '@/common/decorators/is-cuid.decorator';

export class IdParamDto {
  @IsCuid()
  readonly id!: string;
}
