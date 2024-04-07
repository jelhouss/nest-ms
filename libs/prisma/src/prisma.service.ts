import { inspect } from "node:util";

import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";

import { PrismaClient } from "@prisma/client";

import { hash } from "libs/utils";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger: Logger;

  constructor() {
    super();
    this.logger = new Logger(PrismaService.name);
  }

  async onModuleInit() {
    await this.$connect();

    const prismaInstance = this;

    Object.assign(
      this,
      this.$extends({
        query: {
          async $allOperations({ operation, model, args, query }) {
            const start = performance.now();
            const result = await query(args);
            const end = performance.now();
            const time = end - start;

            prismaInstance.logger.log(
              inspect(
                { model, operation, args, time },
                { showHidden: false, depth: null, colors: true },
              ),
            );

            return result;
          },

          user: {
            async create({ args, query }) {
              const password = args.data.password;
              const hashedPassword = await hash(password);

              const user = await query({
                ...args,
                data: { ...args.data, password: hashedPassword },
              });
              return user;
            },
          },
        },
      }),
    );
  }
}
