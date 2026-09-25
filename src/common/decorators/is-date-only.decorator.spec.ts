import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsDateOnly } from './is-date-only.decorator';

class DateDto {
  @IsDateOnly()
  date!: unknown;
}

const validate = (date: unknown) =>
  validateSync(plainToInstance(DateDto, { date }));

describe('IsDateOnly', () => {
  it.each(['2026-01-01', '2024-02-29', '2026-12-31'])(
    'passes for %p',
    (value) => {
      expect(validate(value)).toHaveLength(0);
    },
  );

  it.each([
    '2026-13-01',
    '2026-02-30',
    '2025-02-29',
    '2026-1-1',
    '01-01-2026',
    '2026-01-01T00:00',
    '2026-01-01T00:00:00.000Z',
    '',
    20260101,
  ])('fails for %p', (value) => {
    expect(validate(value)).toHaveLength(1);
  });
});
