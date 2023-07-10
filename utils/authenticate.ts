import { verify } from "../deps.ts";
import type { UserModel } from "../services/database/model/mod.ts";
import type { ServerContext, UserContext } from "../types.ts";

export async function authenticate(
  header: string,
  context: ServerContext,
): Promise<UserContext> {
  const parts = header.split(" ");

  if (parts.length !== 2) {
    throw new Error("Header `Authorization` is invalid");
  }

  const [type, token] = parts;

  if (type !== "Bearer") {
    throw new Error("Header `Authorization` is invalid");
  }

  const payload = await verify(token, context.jwk);

  const userRes = await context.kv.get<UserModel>([
    "user",
    payload.userId as number,
  ]);

  if (userRes.value === null) {
    throw new Error(`User with ID ${payload.userId} not found`);
  }

  return { userRes, user: userRes.value, ...context };
}
