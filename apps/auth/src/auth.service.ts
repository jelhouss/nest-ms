import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { ClientProxy } from "@nestjs/microservices";

import { User } from "@prisma/client";

import { SignUpBodyDTO } from "libs/dtos";
import { UserSignUpEvent } from "libs/events";
import { PrismaService } from "libs/prisma";
import { HealthStatus, TokenPayload } from "libs/types";

@Injectable()
export class AuthService {
  private readonly logger: Logger;

  constructor(
    @Inject("MAILING") private readonly mailingTCPClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  health(): HealthStatus {
    return { status: "up" };
  }

  emitSignUpEmailEvent({ email }: User) {
    this.mailingTCPClient.emit("user_signup", new UserSignUpEvent(email));
  }

  async signAccessToken(userId: number): Promise<string> {
    const ACCESS_TOKEN_SECRET = this.configService.getOrThrow<string>(
      "ACCESS_TOKEN_SECRET",
    ) as string;

    const ACCESS_TOKEN_EXPIRY_MS = this.configService.getOrThrow<number>(
      "ACCESS_TOKEN_EXPIRY_MS",
    ) as number;

    const payload: TokenPayload = {
      userId: userId.toString(),
    };

    const jwtOptions: JwtSignOptions = {
      secret: ACCESS_TOKEN_SECRET,
      expiresIn: ACCESS_TOKEN_EXPIRY_MS,
      subject: userId.toString(),
      audience: "accessToken",
      issuer: "Auth",
    };

    const accessToken = await this.jwtService.signAsync(payload, jwtOptions);

    return accessToken;
  }

  async signRefreshToken(userId: number): Promise<string> {
    const REFRESH_TOKEN_SECRET = this.configService.getOrThrow<string>(
      "REFRESH_TOKEN_SECRET",
    ) as string;

    const REFRESH_TOKEN_EXPIRY_MS = this.configService.getOrThrow<number>(
      "REFRESH_TOKEN_EXPIRY_MS",
    ) as number;

    const payload: TokenPayload = {
      userId: userId.toString(),
    };

    const jwtOptions: JwtSignOptions = {
      secret: REFRESH_TOKEN_SECRET,
      expiresIn: REFRESH_TOKEN_EXPIRY_MS,
      subject: userId.toString(),
      audience: "refreshToken",
      issuer: "Auth",
    };

    const refreshToken = await this.jwtService.signAsync(payload, jwtOptions);

    return refreshToken;
  }

  async signUp({
    email,
    password,
  }: Omit<SignUpBodyDTO, "confirmPassword">): Promise<User> {
    const user = await this.prisma.user.create({
      data: { email, password },
    });
    return user;
  }
}
