import { GraphQLSchema } from "../deps.ts";
import { mergeTypes } from "../util/mod.ts";
import { AnswerMutation, AnswerQuery } from "./answer.ts";
import { DistributionMutation, DistributionQuery } from "./distribution.ts";
import { FieldMutation, FieldQuery } from "./field.ts";
import { UserMutation, UserQuery } from "./user.ts";

export const Query = mergeTypes(
  [
    AnswerQuery,
    FieldQuery,
    DistributionQuery,
    UserQuery,
  ],
  "Query",
);

export const Mutation = mergeTypes(
  [
    AnswerMutation,
    DistributionMutation,
    FieldMutation,
    UserMutation,
  ],
  "Mutation",
);

export const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});
