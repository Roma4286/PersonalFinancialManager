import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponse } from '@/modules/transaction/dto/transaction-response.dto';

export class TransferResponse {
  @Expose() readonly transferGroupId!: string;

  @ApiProperty({ type: () => TransactionResponse, isArray: true })
  @Expose()
  @Type(() => TransactionResponse)
  readonly transactions!: TransactionResponse[];
}
