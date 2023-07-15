import { Router } from "../deps.ts";
import type { ServerContext } from "../types.ts";

export const router = new Router<ServerContext>();

router.all("/bot", (ctx) => {
  return ctx.state.webhook(ctx.request);
});
