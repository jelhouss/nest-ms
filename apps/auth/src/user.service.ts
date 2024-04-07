import { Injectable, Logger } from "@nestjs/common";

import { User } from "@prisma/client";

import { PrismaService } from "libs/prisma";
import { HealthStatus } from "libs/types";

@Injectable()
export class UserService {
  private readonly logger: Logger;

  constructor(private readonly prisma: PrismaService) {
    this.logger = new Logger(UserService.name);
  }

  health(): HealthStatus {
    return { status: "up" };
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }
}
