import { GraphQLSchema } from "../deps.ts";
import { mergeTypes } from "../util/mod.ts";
import { AnswerMutation, AnswerQuery } from "./answer.ts";
import { FieldMutation, FieldQuery } from "./field.ts";
import { RoomMutation, RoomQuery } from "./room.ts";
import { UserMutation, UserQuery } from "./user.ts";

export const Query = mergeTypes(
  [
    AnswerQuery,
    FieldQuery,
    RoomQuery,
    UserQuery,
  ],
  "Query",
);

export const Mutation = mergeTypes(
  [
    AnswerMutation,
    FieldMutation,
    RoomMutation,
    UserMutation,
  ],
  "Mutation",
);

export const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});
