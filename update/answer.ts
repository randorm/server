import { GraphQLNonNull, GraphQLObjectType } from "../deps.ts";
import type {
  ChoiceAnswerModel,
  ChoiceFieldModel,
  TextAnswerModel,
  TextFieldModel,
  UserModel,
} from "../model/mod.ts";
import {
  ChoiceAnswerNode,
  ChoiceFieldNode,
  TextAnswerNode,
  TextFieldNode,
  UserNode,
} from "../type/mod.ts";
import type { Node } from "../types.ts";

export interface SetTextAnswerUpdateModel {
  readonly user: UserModel;
  readonly answer: TextAnswerModel;
  readonly field: TextFieldModel;
}

export const SetTextAnswerUpdate: Node<
  SetTextAnswerUpdateModel
> = new GraphQLObjectType({
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

export interface SetChoiceAnswerUpdateModel {
  readonly user: UserModel;
  readonly answer: ChoiceAnswerModel;
  readonly field: ChoiceFieldModel;
}

export const SetChoiceAnswerUpdate: Node<
  SetChoiceAnswerUpdateModel
> = new GraphQLObjectType({
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
