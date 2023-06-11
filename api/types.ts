import type { GraphQLObjectType } from "./deps.ts";
import type { UserModel } from "./model/mod.ts";

export interface Context {
  readonly kv: Deno.Kv;
  readonly userRes: Deno.KvEntry<UserModel>;
  readonly user: UserModel;
}

export type Node<Model> = GraphQLObjectType<Model, Context>;

export type Operation = GraphQLObjectType<void, Context>;
