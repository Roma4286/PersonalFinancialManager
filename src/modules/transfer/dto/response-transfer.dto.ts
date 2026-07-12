import { Expose } from 'class-transformer';

export class TransferResponse {
  @Expose() readonly transferGroupId!: string;
}
