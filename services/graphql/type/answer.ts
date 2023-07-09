import {
  GraphQLError,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../../../deps.ts";
import type {
  AnswerModel,
  ChoiceAnswerModel,
  ChoiceFieldModel,
  FieldModel,
  TextAnswerModel,
  TextFieldModel,
  UserModel,
} from "../../database/model/mod.ts";
import { FieldType } from "../../database/model/mod.ts";
import { DateTimeScalar } from "../scalar/mod.ts";
import type { Interface, Node } from "../types.ts";
import {
  ChoiceFieldNode,
  FieldInterface,
  FieldTypeEnum,
  TextFieldNode,
  UserNode,
} from "./mod.ts";

export const AnswerInterface: Interface = new GraphQLInterfaceType({
  name: "Answer",
  fields: () => ({
    field: {
      type: new GraphQLNonNull(FieldInterface),
    },
    respondent: {
      type: new GraphQLNonNull(UserNode),
    },
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    createdAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
  }),
  resolveType({ type }: AnswerModel) {
    switch (type) {
      case FieldType.TEXT:
        return "TextAnswer";
      case FieldType.CHOICE:
        return "ChoiceAnswer";
    }
  },
});

export const TextAnswerNode: Node<TextAnswerModel> = new GraphQLObjectType({
  name: "TextAnswer",
  interfaces: [
    AnswerInterface,
  ],
  fields: () => ({
    field: {
      type: new GraphQLNonNull(TextFieldNode),
      async resolve({ fieldId }, _args, { kv }): Promise<TextFieldModel> {
        const res = await kv.get<FieldModel>(["field", fieldId]);

        if (res.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        if (res.value.type !== FieldType.TEXT) {
          throw new GraphQLError(`Field with ID ${fieldId} is not a TextField`);
        }

        return res.value;
      },
    },
    respondent: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ respondentId }, _args, { kv }): Promise<UserModel> {
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
      type: new GraphQLNonNull(DateTimeScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
  }),
});

export const ChoiceAnswerNode: Node<ChoiceAnswerModel> = new GraphQLObjectType({
  name: "ChoiceAnswer",
  interfaces: [
    AnswerInterface,
  ],
  fields: () => ({
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    field: {
      type: new GraphQLNonNull(ChoiceFieldNode),
      async resolve({ fieldId }, _args, { kv }): Promise<ChoiceFieldModel> {
        const res = await kv.get<FieldModel>(["field", fieldId]);

        if (res.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        if (res.value.type !== FieldType.CHOICE) {
          throw new GraphQLError(
            `Field with ID ${fieldId} is not a ChoiceField`,
          );
        }

        return res.value;
      },
    },
    respondent: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ respondentId }, _args, { kv }): Promise<UserModel> {
        const res = await kv.get<UserModel>(["user", respondentId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${respondentId} not found`);
        }

        return res.value;
      },
    },
    indices: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GraphQLInt),
        ),
      ),
    },
    createdAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
  }),
});
