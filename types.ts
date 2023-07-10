import type { Bot } from "./deps.ts";
import type { UserModel } from "./services/database/model/mod.ts";

export interface ServerContext {
  readonly kv: Deno.Kv;
  readonly botToken: string;
  readonly bot: Bot;
  readonly jwk: CryptoKey;
}

export interface UserContext extends ServerContext {
  readonly userRes: Deno.KvEntry<UserModel>;
  readonly user: UserModel;
}
