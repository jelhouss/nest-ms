import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { CACHE_MANAGER, type Cache } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";

import { User } from "@prisma/client";

import {
  FindByIdParamDTO,
  RefreshTokenParamDTO,
  SignInBodyDTO,
  SignOutParamDTO,
  SignUpBodyDTO,
} from "libs/dtos";
import { HealthStatus } from "libs/types";
import {
  excludePassword,
  extractTokenFromHeader,
  hash,
  isHashMatch,
} from "libs/utils";
import { PublicGuard, RefreshGuard } from "libs/guards";

import { AuthService } from "./auth.service";
import { UserService } from "./user.service";

@Controller()
export class AuthController {
  private readonly logger: Logger;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.logger = new Logger(AuthController.name);
  }

  @Get("auth/health")
  health(): HealthStatus {
    return this.authService.health();
  }

  @RefreshGuard()
  @Post("auth/refresh/:id")
  async refreshToken(
    @Req() req: Request,
    @Param() { id }: RefreshTokenParamDTO,
  ): Promise<
    Promise<{
      user: Omit<User, "password">;
      accessToken: string;
      refreshToken: string;
    }>
  > {
    const userRequestedToRefreshToken = await this.userService.findById(id);

    if (!userRequestedToRefreshToken) {
      throw new NotFoundException();
    }

    const oldRefreshToken = extractTokenFromHeader(req) as string;

    const existingRefreshToken = await this.cacheManager.get(
      userRequestedToRefreshToken.id.toString(),
    );

    if (!existingRefreshToken) {
      throw new UnauthorizedException();
    }

    const isRefreshTokenMatch = await isHashMatch(
      existingRefreshToken as string,
      oldRefreshToken,
    );

    if (!isRefreshTokenMatch) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.authService.signAccessToken(
      userRequestedToRefreshToken.id,
    );

    const refreshToken = await this.authService.signRefreshToken(
      userRequestedToRefreshToken.id,
    );

    const hashedRefreshToken = await hash(refreshToken);

    await this.cacheManager.set(
      userRequestedToRefreshToken.id.toString(),
      hashedRefreshToken,
      this.configService.getOrThrow<number>(
        "REFRESH_TOKEN_EXPIRY_MS",
      ) as number,
    );

    return {
      user: excludePassword(userRequestedToRefreshToken),
      accessToken,
      refreshToken,
    };
  }

  @PublicGuard()
  @Post("auth/signup")
  async signUp(
    @Body() { email, password }: SignUpBodyDTO,
  ): Promise<Omit<User, "password">> {
    const userAlreadyExists = await this.userService.findByEmail(email);

    if (userAlreadyExists) {
      throw new ConflictException();
    }

    const user = await this.authService.signUp({ email, password });

    this.authService.emitSignUpEmailEvent(user);

    return excludePassword(user);
  }

  @PublicGuard()
  @Post("auth/signin")
  async signIn(@Body() { email, password }: SignInBodyDTO): Promise<{
    user: Omit<User, "password">;
    accessToken: string;
    refreshToken: string;
  }> {
    const requestedUserToSignIn = await this.userService.findByEmail(email);

    if (!requestedUserToSignIn) {
      throw new NotFoundException();
    }

    const isPasswordMatch = await isHashMatch(
      requestedUserToSignIn.password,
      password,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException();
    }

    const accessToken = await this.authService.signAccessToken(
      requestedUserToSignIn.id,
    );
    const refreshToken = await this.authService.signRefreshToken(
      requestedUserToSignIn.id,
    );

    const hashedRefreshToken = await hash(refreshToken);

    await this.cacheManager.set(
      requestedUserToSignIn.id.toString(),
      hashedRefreshToken,
      this.configService.getOrThrow<number>(
        "REFRESH_TOKEN_EXPIRY_MS",
      ) as number,
    );

    return {
      user: excludePassword(requestedUserToSignIn),
      accessToken,
      refreshToken,
    };
  }

  @Post("auth/signout/:id")
  async signOut(@Param() { id }: SignOutParamDTO): Promise<void> {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException();
    }

    await this.cacheManager.del(user.id.toString());
  }

  // can be cached for a better perf
  @Get("user")
  async findAll(): Promise<Omit<User, "password">[]> {
    const users = await this.userService.findAll();

    return users.map((user) => excludePassword(user));
  }

  @Get("user/health")
  userHealth(): HealthStatus {
    return this.userService.health();
  }

  // can be cached for a better perf
  @Get("user/:id")
  async findById(
    @Param() { id }: FindByIdParamDTO,
  ): Promise<Omit<User, "password">> {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException();
    }

    return excludePassword(user);
  }
}
