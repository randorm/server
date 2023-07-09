import {
  GraphQLBoolean,
  GraphQLEnumType,
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
  AnswerInterface,
  ChoiceAnswerNode,
  TextAnswerNode,
  UserNode,
} from "./mod.ts";

export const FieldTypeEnum = new GraphQLEnumType({
  name: "FieldType",
  values: {
    TEXT: {
      value: "text",
    },
    CHOICE: {
      value: "choice",
    },
  },
});

export const FieldInterface: Interface = new GraphQLInterfaceType({
  name: "Field",
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
    answerCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(AnswerInterface),
        ),
      ),
    },
    createdAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
  }),
  resolveType({ type }: FieldModel) {
    switch (type) {
      case FieldType.TEXT:
        return "TextField";
      case FieldType.CHOICE:
        return "ChoiceField";
    }
  },
});

export const TextFieldNode: Node<TextFieldModel> = new GraphQLObjectType({
  name: "TextField",
  interfaces: [
    FieldInterface,
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
      async resolve({ creatorId }, _args, { kv }): Promise<UserModel> {
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
    answerCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }): Promise<number> {
        const res = await kv.get<Deno.KvU64>(["field:answer_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Answer count to Field with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(TextAnswerNode),
        ),
      ),
      async resolve({ id }, _args, { kv }): Promise<TextAnswerModel[]> {
        const iter = kv.list<AnswerModel>({ prefix: ["answer", id] });

        const answers = [];
        for await (const { value } of iter) {
          if (value.type !== FieldType.TEXT) {
            throw new GraphQLError(
              `Answer to TextField with ID ${value.fieldId} from User with ID ${value.respondentId} is not a TextAnswer`,
            );
          }

          answers.push(value);
        }

        return answers;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
  }),
});

export const ChoiceFieldNode: Node<ChoiceFieldModel> = new GraphQLObjectType({
  name: "ChoiceField",
  interfaces: [
    FieldInterface,
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
      async resolve({ creatorId }, _args, { kv }): Promise<UserModel> {
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
    answerCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }): Promise<number> {
        const res = await kv.get<Deno.KvU64>(["field:answer_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Answer count to ChoiceField with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(ChoiceAnswerNode),
        ),
      ),
      async resolve({ id }, _args, { kv }): Promise<ChoiceAnswerModel[]> {
        const iter = kv.list<AnswerModel>({ prefix: ["answer", id] });

        const answers = [];
        for await (const { value } of iter) {
          if (value.type !== FieldType.CHOICE) {
            throw new GraphQLError(
              `Answer to ChoiceField with ID ${value.fieldId} from User with ID ${value.respondentId} is not a ChoiceAnswer`,
            );
          }

          answers.push(value);
        }

        return answers;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateTimeScalar),
    },
  }),
});
