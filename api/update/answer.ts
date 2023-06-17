import { GraphQLNonNull, GraphQLObjectType } from "../deps.ts";
import {
  ChoiceAnswerNode,
  ChoiceFieldNode,
  TextAnswerNode,
  TextFieldNode,
  UserNode,
} from "../node/mod.ts";

export const SetTextAnswerUpdate = new GraphQLObjectType({
  name: "SetTextAnswerUpdate",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
    },
    answer: {
      type: new GraphQLNonNull(TextAnswerNode),
    },
    field: {
      type: new GraphQLNonNull(TextFieldNode),
    },
  },
});

export const SetChoiceAnswerUpdate = new GraphQLObjectType({
  name: "SetChoiceAnswerUpdate",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
    },
    answer: {
      type: new GraphQLNonNull(ChoiceAnswerNode),
    },
    field: {
      type: new GraphQLNonNull(ChoiceFieldNode),
    },
  },
});
