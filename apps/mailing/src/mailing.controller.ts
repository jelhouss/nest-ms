import { Controller, Get, Logger } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";

import { HealthStatus } from "libs/types";
import { UserSignUpEvent } from "libs/events";

import { MailingService } from "./mailing.service";

@Controller()
export class MailingController {
  private readonly logger: Logger;

  constructor(private readonly mailingService: MailingService) {
    this.logger = new Logger(MailingController.name);
  }

  @Get("health")
  userHealth(): HealthStatus {
    return this.mailingService.health();
  }

  @EventPattern("user_signup")
  handleUserSignUpEvent(data: UserSignUpEvent) {
    this.mailingService.handleUserSignUpEvent(data);
  }
}
