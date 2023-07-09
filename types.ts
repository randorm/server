import type { Bot } from "./deps.ts";
import type { UserModel } from "./services/database/model/mod.ts";

export interface ServerContext {
  readonly kv: Deno.Kv;
  readonly bot: Bot;
}

export interface UserContext extends ServerContext {
  readonly userRes: Deno.KvEntry<UserModel>;
  readonly user: UserModel;
}
