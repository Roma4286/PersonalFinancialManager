import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsAfterOrEqual } from './is-after-or-equal.decorator';

class RangeDto {
  from?: string;

  @IsAfterOrEqual('from')
  to?: string;
}

const validate = (plain: object) =>
  validateSync(plainToInstance(RangeDto, plain));

describe('IsAfterOrEqual', () => {
  it.each([
    [{ from: '2026-01-01', to: '2026-01-02' }],
    [{ from: '2026-01-01', to: '2026-01-01' }],
    [{ to: '2026-01-01' }],
    [{ from: '2026-01-01' }],
    [{}],
  ])('passes for %j', (plain) => {
    expect(validate(plain)).toHaveLength(0);
  });

  it('fails when the value is before the related property', () => {
    const errors = validate({ from: '2026-01-02', to: '2026-01-01' });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isAfterOrEqual: 'from must be <= to',
    });
  });
});
