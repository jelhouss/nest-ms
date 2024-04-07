import { User } from "@prisma/client";

export const excludePassword = (user: User) =>
  Object.fromEntries(
    Object.entries(user).filter(([key]) => key !== "password"),
  ) as Omit<User, "password">;
