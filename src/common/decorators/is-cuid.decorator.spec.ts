import { createId } from '@paralleldrive/cuid2';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsCuid } from './is-cuid.decorator';

class IdDto {
  @IsCuid()
  id!: unknown;
}

const validate = (id: unknown) => validateSync(plainToInstance(IdDto, { id }));

describe('IsCuid', () => {
  it('passes for a generated cuid', () => {
    expect(validate(createId())).toHaveLength(0);
  });

  it.each(['', 'not-a-cuid', 'ABC123', 123, null, undefined])(
    'fails for %p',
    (value) => {
      const errors = validate(value);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toEqual({
        isCuid: 'id must be a valid id',
      });
    },
  );
});
