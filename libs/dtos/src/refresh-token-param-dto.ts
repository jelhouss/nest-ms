import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class RefreshTokenParamDTO {
  @Type(() => Number)
  @IsInt()
  public readonly id: number;
}
