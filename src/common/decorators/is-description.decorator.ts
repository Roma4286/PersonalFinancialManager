import { applyDecorators } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export const DESCRIPTION_MAX_LENGTH = 500;

export function IsDescription() {
  return applyDecorators(
    IsOptional(),
    IsString(),
    MaxLength(DESCRIPTION_MAX_LENGTH),
  );
}
