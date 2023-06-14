import { GraphQLNonNull, GraphQLObjectType } from "../deps.ts";
import {
  ChoiceAnswerNode,
  ChoiceFieldNode,
  TextAnswerNode,
  TextFieldNode,
  UserNode,
} from "../node/mod.ts";

export const TextAnswerUpdate = new GraphQLObjectType({
  name: "TextAnswerUpdate",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
    },
    // TODO(machnevegor): answer count
    answer: {
      type: new GraphQLNonNull(TextAnswerNode),
    },
    field: {
      type: new GraphQLNonNull(TextFieldNode),
    },
  },
});

export const ChoiceAnswerUpdate = new GraphQLObjectType({
  name: "ChoiceAnswerUpdate",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
    },
    // TODO(machnevegor): answer count
    answer: {
      type: new GraphQLNonNull(ChoiceAnswerNode),
    },
    field: {
      type: new GraphQLNonNull(ChoiceFieldNode),
    },
  },
});
