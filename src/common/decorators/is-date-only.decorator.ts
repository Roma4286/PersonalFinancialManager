import { applyDecorators } from '@nestjs/common';
import { IsDateString, Matches } from 'class-validator';

export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function IsDateOnly() {
  return applyDecorators(
    Matches(DATE_ONLY_REGEX, {
      message: ({ property }) => `${property} must be a date in YYYY-MM-DD format`,
    }),
    IsDateString({ strict: true }),
  );
}
