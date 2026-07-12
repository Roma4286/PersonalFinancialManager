import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTransferDto } from './create-transfer.dto';

export class UpdateTransferDto extends PartialType(
  OmitType(CreateTransferDto, ['fromWalletId', 'toWalletId'] as const),
) {}
