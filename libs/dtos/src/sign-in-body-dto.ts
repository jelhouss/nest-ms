import {
  IsEmail,
  IsNotEmpty,
  // Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class SignInBodyDTO {
  @IsEmail()
  public readonly email: string;

  @IsNotEmpty()
  @MaxLength(16)
  @MinLength(8)
  // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  //   message: "Password is weak.",
  // })
  public readonly password: string;
}
