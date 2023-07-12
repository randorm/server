import type { Bot, Context } from "./deps.ts";
import type { SessionData } from "./services/bot/types.ts";
import type { UserModel } from "./services/database/model/mod.ts";
import type { SessionFlavor } from "https://deno.land/x/grammy@v1.17.1/mod.ts";

export type StateFlavor = {
  state: ServerContext;
};

// TODO(Azaki-san): add SessionFlavor
// Done.
export type BotContext = Context & StateFlavor & SessionFlavor<SessionData>;

export interface ServerContext {
  readonly kv: Deno.Kv;
  readonly botToken: string;
  readonly bot: Bot<BotContext>;
  readonly jwk: CryptoKey;
}

export interface UserContext extends ServerContext {
  readonly userRes: Deno.KvEntry<UserModel>;
  readonly user: UserModel;
}
