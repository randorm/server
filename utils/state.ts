import type { MiddlewareFn } from "../deps.ts";
import type { BotContext, ServerContext } from "../types.ts";

export function setupState(state: ServerContext): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    ctx.state = state;

    await next();
  };
}
