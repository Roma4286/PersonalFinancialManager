import { isCuid } from '@paralleldrive/cuid2';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsCuid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCuid',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isCuid(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid id`;
        },
      },
    });
  };
}
