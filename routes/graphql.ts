import {
  graphql,
  GraphQLError,
  renderPlaygroundPage,
  Router,
  Status,
} from "../deps.ts";
import type { UserModel } from "../services/database/model/mod.ts";
import { Gender, Role } from "../services/database/model/mod.ts";
import { schema } from "../services/graphql/mod.ts";
import type { ServerContext, UserContext } from "../types.ts";
import { GraphQLParams } from "../utils/mod.ts";

export const router = new Router<ServerContext>();

router.get("/graphql", (ctx) => {
  ctx.response.type = "text/html";
  ctx.response.body = renderPlaygroundPage({ endpoint: "/graphql" });
});

async function createUser(
  nextId: number,
  kv: Deno.Kv,
  nextIdRes: Deno.KvEntry<Deno.KvU64>,
): Promise<void> {
  const isMale = Math.random() > 0.75;

  const user: UserModel = {
    id: nextId,
    telegramId: nextId,
    username: `user${nextId}`,
    role: Role.EDITOR,
    profile: {
      firstName: isMale ? "John" : "Jane",
      lastName: "Doe",
      gender: isMale ? Gender.MALE : Gender.FEMALE,
      birthday: new Date(),
      bio: "I'm an applicant of the Innopolis University.",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const firstCommitRes = await kv.atomic()
    .check(nextIdRes)
    .set(["user:views", nextId], new Deno.KvU64(0n))
    .set(["user:viewed_count", nextId], new Deno.KvU64(0n))
    .set(["user:viewed_ids", nextId], new Set<number>())
    .set(["user:subscription_count", nextId], new Deno.KvU64(0n))
    .set(["user:subscription_ids", nextId], new Set<number>())
    .set(["user:subscriber_count", nextId], new Deno.KvU64(0n))
    .set(["user:subscriber_ids", nextId], new Set<number>())
    .commit();

  if (!firstCommitRes.ok) {
    throw new Error("Failed to create User");
  }

  const secondCommitRes = await kv.atomic()
    .check(nextIdRes)
    .set(["user", nextId], user)
    .set(["user:field_count", nextId], new Deno.KvU64(0n))
    .set(["user:field_ids", nextId], new Set<number>())
    .set(["user:distribution_count", nextId], new Deno.KvU64(0n))
    .set(["user:distribution_ids", nextId], new Set<number>())
    .set(["user:group_count", nextId], new Deno.KvU64(0n))
    .set(["user:group_ids", nextId], new Set<number>())
    .sum(["user_count"], 1n)
    .sum(["user_next_id"], 1n)
    .commit();

  if (!secondCommitRes.ok) {
    throw new Error("Failed to create User");
  }
}

async function getUserRes(
  kv: Deno.Kv,
  userId: number,
): Promise<Deno.KvEntry<UserModel>> {
  const nextIdRes = await kv.get<Deno.KvU64>(["user_next_id"]);

  if (nextIdRes.value === null) {
    throw new GraphQLError("Next User ID not found");
  }

  const nextId = Number(nextIdRes.value);

  if (userId === nextId) {
    await createUser(nextId, kv, nextIdRes);
  }

  const userRes = await kv.get<UserModel>(["user", userId]);

  if (userRes.value === null) {
    throw new GraphQLError(`User with ID ${userId} not found`);
  }

  return userRes;
}

async function createContext(
  header: string | null,
  context: ServerContext,
): Promise<UserContext> {
  let userId = 1;
  if (header) {
    const parts = header.split(" ");

    userId = parts.length === 2 ? Number(parts[1]) : 1;
  }

  const userRes = await getUserRes(context.kv, userId);

  return {
    kv: context.kv,
    bot: context.bot,
    userRes,
    user: userRes.value,
  };
}

router.post("/graphql", async (ctx) => {
  const body = ctx.request.body();

  if (body.type !== "json") {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "text/plain";
    ctx.response.body = "Request body must be JSON";

    return;
  }

  const bodyValue = await body.value;

  const validationResult = GraphQLParams.safeParse(bodyValue);

  if (!validationResult.success) {
    ctx.response.status = Status.BadRequest;
    ctx.response.type = "text/plain";
    ctx.response.body = validationResult.error.message;

    return;
  }

  ctx.response.status = Status.OK;
  ctx.response.type = "json";

  try {
    const { query, variables, operationName } = validationResult.data;

    const executionResult = await graphql({
      schema,
      source: query,
      contextValue: createContext(
        ctx.request.headers.get("Authorization"),
        ctx.state,
      ),
      variableValues: variables,
      operationName,
    });

    ctx.response.body = executionResult;
  } catch (error) {
    ctx.response.body = { errors: [error], data: null };
  }
});
