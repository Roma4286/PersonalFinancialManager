import { applyDecorators } from '@nestjs/common';
import { IsInt, IsPositive, Max } from 'class-validator';

export const MAX_AMOUNT_IN_CENTS = 2_147_483_647;

export function IsAmountInCents() {
  return applyDecorators(
    IsInt(),
    IsPositive({ message: 'Amount must be > 0' }),
    Max(MAX_AMOUNT_IN_CENTS, {
      message: `Amount must be <= ${MAX_AMOUNT_IN_CENTS}`,
    }),
  );
}
