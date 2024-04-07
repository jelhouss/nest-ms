import {
  IsEmail,
  IsNotEmpty,
  // Matches,
  MaxLength,
  MinLength,
} from "class-validator";

// import { MatchCustomValidator } from "libs/validators";

export class SignUpBodyDTO {
  @IsEmail()
  public readonly email: string;

  @IsNotEmpty()
  @MaxLength(16)
  @MinLength(8)
  // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  //   message: "Password is weak.",
  // })
  public readonly password: string;

  @IsNotEmpty()
  @MaxLength(16)
  @MinLength(8)
  // @MatchCustomValidator("password", {
  //   message:
  //     "Please verify your password, the actual password and password confirmation values are different.",
  // })
  public readonly confirmPassword: string;
}
