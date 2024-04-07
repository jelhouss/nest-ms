import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

import { AuthGuard } from "libs/guards";
import { Environment } from "libs/types";

import { MailingController } from "./mailing.controller";
import { MailingService } from "./mailing.service";

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
  ],
  controllers: [MailingController],
  providers: [
    MailingService,
    // register the AuthGuard as a global guard
    // instead of using `@UseGuards()` decorator on top of each controller
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class MailingModule {}
