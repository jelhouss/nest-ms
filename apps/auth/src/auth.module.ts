import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { LoggerModule } from "nestjs-pino";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { CacheModule } from "@nestjs/cache-manager";

import { AuthGuard } from "libs/guards";
import { Environment } from "libs/types";
import { PrismaModule } from "libs/prisma";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserService } from "./user.service";

const rootDir = process.cwd();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${rootDir}/.env`,
      expandVariables: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const NODE_ENV = configService.getOrThrow<string>(
          "NODE_ENV",
        ) as Environment;

        const prettyTransport = {
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: "UTC:yyyy-mm-dd h:MM:ss T Z",
            messageFormat: "{req.headers.x-correlation-id} [{context}] {msg}",
          },
        };

        const dateTime = new Date().toISOString();

        const logToFileTransport = {
          target: "pino/file",
          options: {
            destination: `${rootDir}/logs/pino-${dateTime}.log`,
          },
        };

        return {
          pinoHttp: {
            customProps: (request, response) => ({
              context: "HTTP",
            }),
            transport: {
              targets:
                NODE_ENV === "development"
                  ? [logToFileTransport, prettyTransport]
                  : [logToFileTransport],
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    JwtModule,
    CacheModule.register(),
    ClientsModule.registerAsync([
      {
        name: "MAILING",
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          const MAILING_TCP_PORT = configService.getOrThrow<number>(
            "MAILING_TCP_PORT",
          ) as number;

          return {
            transport: Transport.TCP,
            options: { port: MAILING_TCP_PORT, host: "mailing" },
          };
        },
        inject: [ConfigService],
      },
    ]),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    // register the AuthGuard as a global guard
    // instead of using `@UseGuards()` decorator on top of each controller
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
