import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  IsAmountInCents,
  MAX_AMOUNT_IN_CENTS,
} from './is-amount-in-cents.decorator';

class AmountDto {
  @IsAmountInCents()
  amountInCents!: unknown;
}

const validate = (amountInCents: unknown) =>
  validateSync(plainToInstance(AmountDto, { amountInCents }));

describe('IsAmountInCents', () => {
  it.each([1, 100, MAX_AMOUNT_IN_CENTS])('passes for %p', (value) => {
    expect(validate(value)).toHaveLength(0);
  });

  it.each([0, -1, 1.5, MAX_AMOUNT_IN_CENTS + 1, '100', null, undefined])(
    'fails for %p',
    (value) => {
      expect(validate(value)).toHaveLength(1);
    },
  );
});
