import type { GraphQLInterfaceType, GraphQLObjectType } from "../../deps.ts";
import type { UserContext } from "../../types.ts";

export type Interface = GraphQLInterfaceType;

export type Node<T> = GraphQLObjectType<T, UserContext>;

export type Operation = Node<void>;
