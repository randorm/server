import type { Bot, Context } from "./deps.ts";
import type { UserModel } from "./services/database/model/mod.ts";

export type StateFlavor = {
  state: ServerContext;
};

export type BotContext = Context & StateFlavor;

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
