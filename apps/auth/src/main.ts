import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger as PINOLOGGER, LoggerErrorInterceptor } from "nestjs-pino";

import { Environment } from "libs/types";

import { AuthModule } from "./auth.module";

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, { bufferLogs: true });

  const configService = app.get(ConfigService);

  const AUTH_PORT = configService.getOrThrow<number>("AUTH_PORT") as number;
  const NODE_ENV = configService.getOrThrow<string>("NODE_ENV") as Environment;

  // logging
  app.useLogger(app.get(PINOLOGGER));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      // Payloads coming in over the network are plain JavaScript objects.
      // The ValidationPipe can automatically transform payloads to be objects typed according to their DTO classes.
      // To enable auto-transformation, set `transform` to true
      transform: true,

      // Our ValidationPipe can also filter out properties that should not be received by the method handler.
      // In this case, we can whitelist the acceptable properties, and any property not included in the whitelist is automatically stripped from the resulting object.
      // For example, if our handler expects email and password properties, but a request also includes an age property, this property can be automatically removed from the resulting DTO.
      // To enable such behavior, set `whitelist` to true.
      whitelist: true,

      // stop the request from processing when non-whitelisted properties are present, and return an error response to the user.
      // To enable this, set the `forbidNonWhitelisted` option property to true, in combination with setting `whitelist` to true
      forbidNonWhitelisted: true,
    })
  );

  await app.listen(AUTH_PORT);

  if (NODE_ENV === "development") {
    const logger = new Logger("Auth");
    const url = await app.getUrl();
    logger.log(`Listening on ${url}`);
  }
}

bootstrap();

process.on("unhandledRejection", (error) => {
  console.error("unhandledRejection %O", error);
});
