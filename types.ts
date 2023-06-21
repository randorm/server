import type { GraphQLInterfaceType, GraphQLObjectType } from "./deps.ts";
import type { UserModel } from "./model/mod.ts";

export type Interface = GraphQLInterfaceType;

export interface NodeContext {
  readonly kv: Deno.Kv;
  readonly userRes: Deno.KvEntry<UserModel>;
  readonly user: UserModel;
}

export type Node<Model> = GraphQLObjectType<Model, NodeContext>;

export type Operation = Node<void>;
