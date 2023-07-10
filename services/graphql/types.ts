import type { GraphQLInterfaceType, GraphQLObjectType } from "../../deps.ts";
import type { ServerContext, UserContext } from "../../types.ts";

export type Interface = GraphQLInterfaceType;

export type Node<T> = GraphQLObjectType<T, ServerContext | UserContext>;

export type Operation = Node<void>;
