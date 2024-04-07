import * as argon2 from "argon2";

export const hash = async (plain: string) => await argon2.hash(plain);
