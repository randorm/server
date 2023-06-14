import { assertChoiceAnswer, assertTextAnswer } from "../assert/mod.ts";
import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type {
  AnswerModel,
  ChoiceAnswerModel,
  FieldModel,
  TextAnswerModel,
  UserModel,
} from "../model/mod.ts";
import { FieldTypeModel } from "../model/mod.ts";
import { AnswerNode } from "../node/mod.ts";
import type { Operation } from "../types.ts";
import { ChoiceAnswerUpdate, TextAnswerUpdate } from "../update/mod.ts";
import { asyncMap } from "../util/mod.ts";

export const AnswerQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    answer: {
      type: new GraphQLNonNull(AnswerNode),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        respondentId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { fieldId, respondentId }, { kv }) {
        const res = await kv.get<AnswerModel>([
          "answer",
          fieldId,
          respondentId,
        ]);

        if (res.value === null) {
          throw new GraphQLError(
            `Answer to Field with ID ${fieldId} from User with ID ${respondentId} not found`,
          );
        }

        return res.value;
      },
    },
    answerCount: {
      type: new GraphQLNonNull(GraphQLInt),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { fieldId }, { kv }) {
        const res = await kv.get<Deno.KvU64>(["field:answer_count", fieldId]);

        if (res.value === null) {
          throw new GraphQLError(
            `Answer count to Field with ID ${fieldId} not found`,
          );
        }

        return Number(res.value);
      },
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(AnswerNode),
        ),
      ),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { fieldId }, { kv }) {
        const iter = kv.list<AnswerModel>({ prefix: ["answer", fieldId] });

        return await asyncMap(({ value }) => value, iter);
      },
    },
  },
});

export const AnswerMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    setTextAnswer: {
      type: new GraphQLNonNull(TextAnswerUpdate),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        value: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, { fieldId, value }, { kv, user, userRes }) {
        const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

        if (fieldRes.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        if (fieldRes.value.type !== FieldTypeModel.TEXT) {
          throw new GraphQLError(
            `Field with ID ${fieldRes.value.id} is not a TextField`,
          );
        }

        const answerRes = await kv.get<TextAnswerModel>([
          "answer",
          fieldId,
          user.id,
        ]);

        if (answerRes.value === null) {
          const answer: TextAnswerModel = {
            fieldId,
            respondentId: user.id,
            type: FieldTypeModel.TEXT,
            value,
            creadtedAt: new Date(),
            updatedAt: new Date(),
          };

          assertTextAnswer(answer, fieldRes.value);

          const userUpdate: UserModel = {
            ...user,
            fieldIds: new Set([...user.fieldIds, fieldId]),
            updatedAt: new Date(),
          };

          const commitRes = await kv.atomic()
            .check(answerRes)
            .check(userRes)
            .set(["answer", fieldId, user.id], answer)
            .set(["user", user.id], userUpdate)
            .sum(["field:answer_count", fieldId], 1n)
            .commit();

          if (!commitRes.ok) {
            throw new GraphQLError("Failed to create Answer");
          }

          return { user, answer, field: fieldRes.value };
        }

        const answerUpdate: TextAnswerModel = {
          ...answerRes.value,
          value,
          updatedAt: new Date(),
        };

        assertTextAnswer(answerUpdate, fieldRes.value);

        const commitRes = await kv.atomic()
          .check(answerRes)
          .set(["answer", fieldId, user.id], answerUpdate)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Answer to Field with ID ${fieldId} from User with ID ${user.id}`,
          );
        }

        return { user, answer: answerUpdate, field: fieldRes.value };
      },
    },
    setChoiceAnswer: {
      type: new GraphQLNonNull(ChoiceAnswerUpdate),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        value: {
          type: new GraphQLNonNull(
            new GraphQLList(
              new GraphQLNonNull(GraphQLInt),
            ),
          ),
        },
      },
      async resolve(_root, { fieldId, value }, { kv, user, userRes }) {
        const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

        if (fieldRes.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        if (fieldRes.value.type !== FieldTypeModel.CHOICE) {
          throw new GraphQLError(
            `Field with ID ${fieldRes.value.id} is not a ChoiceField`,
          );
        }

        const answerRes = await kv.get<ChoiceAnswerModel>([
          "answer",
          fieldId,
          user.id,
        ]);

        if (answerRes.value === null) {
          const answer: ChoiceAnswerModel = {
            fieldId,
            respondentId: user.id,
            type: FieldTypeModel.CHOICE,
            value,
            creadtedAt: new Date(),
            updatedAt: new Date(),
          };

          assertChoiceAnswer(answer, fieldRes.value);

          const userUpdate: UserModel = {
            ...user,
            fieldIds: new Set([...user.fieldIds, fieldId]),
            updatedAt: new Date(),
          };

          const commitRes = await kv.atomic()
            .check(answerRes)
            .check(userRes)
            .set(["answer", fieldId, user.id], answer)
            .set(["user", user.id], userUpdate)
            .sum(["field:answer_count", fieldId], 1n)
            .commit();

          if (!commitRes.ok) {
            throw new GraphQLError("Failed to create Answer");
          }

          return { user, answer, field: fieldRes.value };
        }

        const answerUpdate: ChoiceAnswerModel = {
          ...answerRes.value,
          value,
          updatedAt: new Date(),
        };

        assertChoiceAnswer(answerUpdate, fieldRes.value);

        const commitRes = await kv.atomic()
          .check(answerRes)
          .set(["answer", fieldId, user.id], answerUpdate)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Answer to Field with ID ${fieldId} from User with ID ${user.id}`,
          );
        }

        return { user, answer: answerUpdate, field: fieldRes.value };
      },
    },
  },
});
