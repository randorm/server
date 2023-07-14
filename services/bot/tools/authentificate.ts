import { ServerContext, UserContext, UserModel } from "../../bot/mod.ts";

export async function createUserContext(
  context: ServerContext,
  id: number,
): Promise<UserContext> {
  const userRes = await context.kv.get<UserModel>([
    "user",
    id,
  ]);

  if (userRes.value === null) {
    throw new Error(`User with ID ${id} not found`);
  }

  return { userRes: userRes, user: userRes.value, ...context };
}
