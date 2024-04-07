import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService, JwtVerifyOptions } from "@nestjs/jwt";

import { TokenPayload } from "libs/types";
import { extractTokenFromHeader } from "libs/utils";

export const IS_PUBLIC = "isPublicRoute";
export const PublicGuard = () => SetMetadata(IS_PUBLIC, true);

export const IS_REFRESH = "isRefreshTokenRoute";
export const RefreshGuard = () => SetMetadata(IS_REFRESH, true);

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger: Logger;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.logger = new Logger(AuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isRefreshTokenRoute = this.reflector.getAllAndOverride<boolean>(
      IS_REFRESH,
      [context.getHandler(), context.getClass()],
    );

    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    let verifyTokenOptions: JwtVerifyOptions = {
      secret: this.configService.getOrThrow<string>("ACCESS_TOKEN_SECRET"),
      audience: "accessToken",
      issuer: "Auth",
    };

    if (isRefreshTokenRoute) {
      verifyTokenOptions = {
        secret: this.configService.getOrThrow<string>("REFRESH_TOKEN_SECRET"),
        audience: "refreshToken",
        issuer: "Auth",
      };
    }

    const req = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const { userId }: TokenPayload = await this.jwtService.verifyAsync(
        token,
        verifyTokenOptions,
      );

      if (userId) {
        req.userId = userId;

        return true;
      }
    } catch {
      throw new UnauthorizedException();
    }

    return false;
  }
}
