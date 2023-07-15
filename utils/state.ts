import type { ServerContext } from "../types.ts";

export function setupState(state: ServerContext) {
  return (ctx: { state: ServerContext }, next: () => unknown) => {
    ctx.state = state;

    return next();
  };
}
