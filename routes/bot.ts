import { Router } from "../deps.ts";
import type { ServerContext } from "../types.ts";

export const router = new Router<ServerContext>();

router.post("/bot", (ctx) => {
  return ctx.state.webhook(ctx.request);
});
