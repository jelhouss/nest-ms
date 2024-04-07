import * as argon2 from "argon2";

export const isHashMatch = async (hash: string, plain: string) =>
  await argon2.verify(hash, plain);
