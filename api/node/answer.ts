import {
  GraphQLError,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "../deps.ts";
import { FieldTypeEnum } from "../enum/mod.ts";
import type {
  ChoiceAnswerModel,
  ChoiceFieldModel,
  TextAnswerModel,
  TextFieldModel,
  UserModel,
} from "../model/mod.ts";
import { FieldTypeModel } from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import { FieldNode, UserNode } from "./mod.ts";

export const BaseAnswerInterface = new GraphQLInterfaceType({
  name: "BaseAnswer",
  fields: () => ({
    field: {
      type: new GraphQLNonNull(FieldNode),
    },
    respondent: {
      type: new GraphQLNonNull(UserNode),
    },
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const TextAnswerNode: Node<TextAnswerModel> = new GraphQLObjectType({
  name: "TextAnswer",
  interfaces: [
    BaseAnswerInterface,
  ],
  fields: () => ({
    field: {
      type: new GraphQLNonNull(FieldNode),
      async resolve({ fieldId }, _args, { kv }) {
        const res = await kv.get<TextFieldModel>(["field", fieldId]);

        if (res.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        if (res.value.type !== FieldTypeModel.TEXT) {
          throw new GraphQLError(
            `Field with ID ${fieldId} is not a text field`,
          );
        }

        return res.value;
      },
    },
    respondent: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ respondentId }, _args, { kv }) {
        const res = await kv.get<UserModel>(["user", respondentId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${respondentId} not found`);
        }

        return res.value;
      },
    },
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    value: {
      type: new GraphQLNonNull(GraphQLString),
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const ChoiceAnswerNode: Node<ChoiceAnswerModel> = new GraphQLObjectType({
  name: "ChoiceAnswer",
  interfaces: [
    BaseAnswerInterface,
  ],
  fields: () => ({
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    field: {
      type: new GraphQLNonNull(FieldNode),
      async resolve({ fieldId }, _args, { kv }) {
        const res = await kv.get<ChoiceFieldModel>(["field", fieldId]);

        if (res.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        if (res.value.type !== FieldTypeModel.CHOICE) {
          throw new GraphQLError(
            `Field with ID ${fieldId} is not a choice field`,
          );
        }

        return res.value;
      },
    },
    respondent: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ respondentId }, _args, { kv }) {
        const res = await kv.get<UserModel>(["user", respondentId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${respondentId} not found`);
        }

        return res.value;
      },
    },
    value: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GraphQLInt),
        ),
      ),
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const AnswerNode = new GraphQLUnionType({
  name: "Answer",
  types: [
    TextAnswerNode,
    ChoiceAnswerNode,
  ],
  resolveType({ type }) {
    switch (type) {
      case FieldTypeModel.TEXT:
        return "TextAnswer";
      case FieldTypeModel.CHOICE:
        return "ChoiceAnswer";
      default:
        throw new GraphQLError(`Unknown answer type: ${type}`);
    }
  },
});
