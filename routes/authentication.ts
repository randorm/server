import {
  checkSignature,
  create,
  difference,
  mapValues,
  Router,
  Status,
  validateWebAppData,
  z,
} from "../deps.ts";
import type { UserModel } from "../services/database/model/mod.ts";
import type { ServerContext } from "../types.ts";
import {
  AUTHENTICATION_TIME_LIMIT,
  AUTHENTICATION_TOKEN_TTL,
  AuthenticationData,
} from "../utils/mod.ts";

export const router = new Router<ServerContext>();

router.post("/authenticate", async (ctx) => {
  const body = ctx.request.body();

  let authenticationData: z.infer<typeof AuthenticationData>;
  switch (body.type) {
    case "json": {
      const bodyValue = await body.value;

      const validationResult = AuthenticationData.safeParse(bodyValue);

      if (!validationResult.success) {
        ctx.response.status = Status.BadRequest;
        ctx.response.type = "text/plain";
        ctx.response.body = validationResult.error.message;

        return;
      }

      const signatureResult = checkSignature(
        ctx.state.botToken,
        mapValues(
          validationResult.data,
          (value) => typeof value === "string" ? value : String(value),
        ),
      );

      if (!signatureResult) {
        ctx.response.status = Status.Unauthorized;
        ctx.response.type = "text/plain";
        ctx.response.body = "Invalid signature";

        return;
      }

      authenticationData = validationResult.data;

      break;
    }
    case "text": {
      const bodyValue = await body.value;
      console.log(bodyValue);

      const searchParams = new URLSearchParams(bodyValue);

      const signatureResult = validateWebAppData(
        ctx.state.botToken,
        searchParams,
      );

      if (!signatureResult) {
        ctx.response.status = Status.Unauthorized;
        ctx.response.type = "text/plain";
        ctx.response.body = "Invalid signature";

        return;
      }

      const serializedUser = searchParams.get("user");

      if (!serializedUser) {
        ctx.response.status = Status.BadRequest;
        ctx.response.type = "text/plain";
        ctx.response.body = "Invalid request body";

        return;
      }

      const validationResult = AuthenticationData.safeParse(
        JSON.parse(serializedUser),
      );

      if (!validationResult.success) {
        ctx.response.status = Status.BadRequest;
        ctx.response.type = "text/plain";
        ctx.response.body = validationResult.error.message;

        return;
      }

      authenticationData = validationResult.data;

      break;
    }
    default: {
      ctx.response.status = Status.BadRequest;
      ctx.response.type = "text/plain";
      ctx.response.body = "Invalid request body type";

      return;
    }
  }

  const { milliseconds } = difference(
    new Date(authenticationData.auth_date * 1000),
    new Date(),
    { units: ["milliseconds"] },
  );

  if (!milliseconds || milliseconds > AUTHENTICATION_TIME_LIMIT) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.type = "text/plain";
    ctx.response.body = "Authentication time limit exceeded";

    return;
  }

  const userByTelegramIdRes = await ctx.state.kv.get<number>([
    "user_by_telegram_id",
    authenticationData.id,
  ]);

  if (userByTelegramIdRes.value === null) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.type = "text/plain";
    ctx.response.body = "User not found";

    return;
  }

  const userRes = await ctx.state.kv.get<UserModel>([
    "user",
    userByTelegramIdRes.value,
  ]);

  if (userRes.value === null) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.type = "text/plain";
    ctx.response.body = "User not found";

    return;
  }

  const token = await create(
    { alg: "HS512", typ: "JWT", expiresIn: AUTHENTICATION_TOKEN_TTL },
    { userId: userRes.value.id },
    ctx.state.jwk,
  );

  ctx.response.status = Status.OK;
  ctx.response.type = "text/plain";
  ctx.response.body = token;
});
