import { Injectable, Logger } from "@nestjs/common";

import { UserSignUpEvent } from "libs/events";
import { HealthStatus } from "libs/types";

@Injectable()
export class MailingService {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(MailingService.name);
  }

  health(): HealthStatus {
    return { status: "up" };
  }

  handleUserSignUpEvent(data: UserSignUpEvent) {
    this.logger.log(data);
    // do something when the user sign up (e.g. send email)
  }
}
