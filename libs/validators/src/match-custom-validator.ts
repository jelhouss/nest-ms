import {
  type ValidationOptions,
  registerDecorator,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from "class-validator";

export const MatchCustomValidator =
  (property: string, validationOptions?: ValidationOptions) =>
  // biome-ignore lint: I don't know what specific type should I give to `object`
  (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchCustomValidatorConstraint,
    });
  };

@ValidatorConstraint({ name: "MatchCustomValidator" })
class MatchCustomValidatorConstraint implements ValidatorConstraintInterface {
  // biome-ignore lint: I don't know what specific type should I give to `value`
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;

    // biome-ignore lint: I don't know what specific type should I give to `args.object`
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }
}
