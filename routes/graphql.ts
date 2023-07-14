import { graphql, renderPlaygroundPage, Router, Status } from "../deps.ts";
import { schema } from "../services/graphql/mod.ts";
import type { ServerContext } from "../types.ts";
import { authenticate, GraphQLParams } from "../utils/mod.ts";

export const router = new Router<ServerContext>();

router.get("/graphql", (ctx) => {
  ctx.response.status = Status.OK;
  ctx.response.type = "text/html";
  ctx.response.body = renderPlaygroundPage({ endpoint: "/graphql" });
});

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

  // try {
  //   const { query, variables, operationName } = validationResult.data;

  //   const authorization = ctx.request.headers.get("Authorization");

  //   const executionResult = await graphql({
  //     schema,
  //     source: query,
  //     contextValue: authorization
  //       ? await authenticate(authorization, ctx.state)
  //       : ctx.state,
  //     variableValues: variables,
  //     operationName,
  //   });

  //   ctx.response.body = executionResult;
  // } catch (error) {
  //   ctx.response.body = { errors: [error], data: null };
  // }

  const { query, variables, operationName } = validationResult.data;

  const authorization = ctx.request.headers.get("Authorization");

  console.log(ctx.state);

  const executionResult = await graphql({
    schema,
    source: query,
    contextValue: authorization
      ? await authenticate(authorization, ctx.state)
      : ctx.state,
    variableValues: variables,
    operationName,
  });

  ctx.response.body = executionResult;
});
