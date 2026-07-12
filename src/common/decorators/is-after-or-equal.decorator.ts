import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsAfterOrEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterOrEqual',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const relatedPropertyName = args.constraints[0] as string;
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (value === undefined || relatedValue === undefined) {
            return true;
          }

          return (
            new Date(value as string).getTime() >=
            new Date(relatedValue as string).getTime()
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const relatedPropertyName = args.constraints[0] as string;
          return `${relatedPropertyName} must be <= ${args.property}`;
        },
      },
    });
  };
}
