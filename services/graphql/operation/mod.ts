import { mergeObjectTypes } from "../tools/mod.ts";
import type { UserContext } from "../../../types.ts";
import { AnswerMutation, AnswerQuery } from "./answer.ts";
import { DistributionMutation, DistributionQuery } from "./distribution.ts";
import { FieldMutation, FieldQuery } from "./field.ts";
import { GroupQuery } from "./group.ts";
import { UserMutation, UserQuery } from "./user.ts";

export const query = mergeObjectTypes<
  [void, void, void, void, void],
  UserContext
>(
  [
    AnswerQuery,
    FieldQuery,
    DistributionQuery,
    GroupQuery,
    UserQuery,
  ],
  "Query",
);

export const mutation = mergeObjectTypes<
  [void, void, void, void],
  UserContext
>(
  [
    AnswerMutation,
    DistributionMutation,
    FieldMutation,
    UserMutation,
  ],
  "Mutation",
);
