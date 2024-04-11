import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import { MatchCustomValidator } from "libs/validators";

export class SignUpBodyDTO {
  @IsEmail()
  public readonly email: string;

  @IsNotEmpty()
  @MaxLength(16)
  @MinLength(8)
  // min 8 length, max 16 length, at least: one upper and lower letter, one digit, one special character
  @Matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/, {
    message: "Password is weak.",
  })
  public readonly password: string;

  @IsNotEmpty()
  @MaxLength(16)
  @MinLength(8)
  @MatchCustomValidator("password", {
    message:
      "Please verify your password, the actual password and password confirmation values are different.",
  })
  public readonly confirmPassword: string;
}
