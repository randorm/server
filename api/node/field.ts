import {
  GraphQLBoolean,
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
import { AnswerNode, UserNode } from "./mod.ts";

export const BaseFieldInterface = new GraphQLInterfaceType({
  name: "BaseField",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    creator: {
      type: new GraphQLNonNull(UserNode),
    },
    required: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    question: {
      type: new GraphQLNonNull(GraphQLString),
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(AnswerNode),
        ),
      ),
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const TextFieldNode: Node<TextFieldModel> = new GraphQLObjectType({
  name: "TextField",
  interfaces: [
    BaseFieldInterface,
  ],
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    creator: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ creatorId }, _args, { kv }) {
        const res = await kv.get<UserModel>(["user", creatorId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${creatorId} not found`);
        }

        return res.value;
      },
    },
    required: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    question: {
      type: new GraphQLNonNull(GraphQLString),
    },
    format: {
      type: GraphQLString,
    },
    sample: {
      type: GraphQLString,
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(AnswerNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const iter = kv.list<TextAnswerModel>({ prefix: ["answer", id] });

        const answers = [];
        for await (const { value } of iter) {
          if (value.type !== FieldTypeModel.TEXT) {
            throw new GraphQLError(
              `Answer to Field with ID ${value.fieldId} from User with ID ${value.respondentId} is not a text answer`,
            );
          }

          answers.push(value);
        }

        return answers;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const ChoiceFieldNode: Node<ChoiceFieldModel> = new GraphQLObjectType({
  name: "ChoiceField",
  interfaces: [
    BaseFieldInterface,
  ],
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    type: {
      type: new GraphQLNonNull(FieldTypeEnum),
    },
    creator: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ creatorId }, _args, { kv }) {
        const res = await kv.get<UserModel>(["user", creatorId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${creatorId} not found`);
        }

        return res.value;
      },
    },
    required: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    question: {
      type: new GraphQLNonNull(GraphQLString),
    },
    multiple: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    options: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GraphQLString),
        ),
      ),
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(AnswerNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const iter = kv.list<ChoiceAnswerModel>({ prefix: ["answer", id] });

        const answers = [];
        for await (const { value } of iter) {
          if (value.type !== FieldTypeModel.CHOICE) {
            throw new GraphQLError(
              `Answer to Field with ID ${value.fieldId} from User with ID ${value.respondentId} is not a choice answer`,
            );
          }

          answers.push(value);
        }

        return answers;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const FieldNode = new GraphQLUnionType({
  name: "Field",
  types: [
    TextFieldNode,
    ChoiceFieldNode,
  ],
  resolveType({ type }) {
    switch (type) {
      case FieldTypeModel.TEXT:
        return "TextField";
      case FieldTypeModel.CHOICE:
        return "ChoiceField";
      default:
        throw new GraphQLError(`Unknown Field type: ${type}`);
    }
  },
});
