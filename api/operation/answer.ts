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
} from "../model/mod.ts";
import { FieldTypeModel } from "../model/mod.ts";
import { AnswerNode, ChoiceAnswerNode, TextAnswerNode } from "../node/mod.ts";
import type { Operation } from "../types.ts";
import { asyncMap } from "../util/mod.ts";

export const AnswerQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
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

        return res.value === null ? 0 : Number(res.value);
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
  }),
});

export const AnswerMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    setTextAnswer: {
      type: new GraphQLNonNull(TextAnswerNode),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        value: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, { fieldId, value }, { kv, user }) {
        const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

        if (fieldRes.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }
        if (fieldRes.value.type !== FieldTypeModel.TEXT) {
          throw new GraphQLError(
            `Field with ID ${fieldRes.value.id} is not a text field`,
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

          const commitRes = await kv.atomic()
            .check(answerRes)
            .set(["answer", fieldId, user.id], answer)
            .sum(["field:answer_count", fieldId], 1n)
            .commit();

          if (!commitRes.ok) {
            throw new GraphQLError("Failed to create Answer");
          }

          return answer;
        }

        const answer: TextAnswerModel = {
          ...answerRes.value,
          value,
          updatedAt: new Date(),
        };

        assertTextAnswer(answer, fieldRes.value);

        const commitRes = await kv.atomic()
          .check(answerRes)
          .set(["answer", fieldId, user.id], answer)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Answer to Field with ID ${fieldId} from User with ID ${user.id}`,
          );
        }

        return answer;
      },
    },
    setChoiceAnswer: {
      type: new GraphQLNonNull(ChoiceAnswerNode),
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
      async resolve(_root, { fieldId, value }, { kv, user }) {
        const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

        if (fieldRes.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }
        if (fieldRes.value.type !== FieldTypeModel.CHOICE) {
          throw new GraphQLError(
            `Field with ID ${fieldRes.value.id} is not a choice field`,
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

          const commitRes = await kv.atomic()
            .check(answerRes)
            .set(["answer", fieldId, user.id], answer)
            .sum(["field:answer_count", fieldId], 1n)
            .commit();

          if (!commitRes.ok) {
            throw new GraphQLError("Failed to create Answer");
          }

          return answer;
        }

        const answer: ChoiceAnswerModel = {
          ...answerRes.value,
          value,
          updatedAt: new Date(),
        };

        assertChoiceAnswer(answer, fieldRes.value);

        const commitRes = await kv.atomic()
          .check(answerRes)
          .set(["answer", fieldId, user.id], answer)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Answer to Field with ID ${fieldId} from User with ID ${user.id}`,
          );
        }

        return answer;
      },
    },
    deleteAnswer: {
      type: new GraphQLNonNull(AnswerNode),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { fieldId }, { user, kv }) {
        const answerRes = await kv.get<AnswerModel>([
          "answer",
          fieldId,
          user.id,
        ]);

        if (answerRes.value === null) {
          throw new GraphQLError(
            `Answer to Field with ID ${fieldId} from User with ID ${user.id} not found`,
          );
        }

        const commitRes = await kv.atomic()
          .check(answerRes)
          .delete(["answer", fieldId, user.id])
          .sum(["field:answer_count", fieldId], -1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to delete Answer to Field with ID ${fieldId} from User with ID ${user.id}`,
          );
        }

        return answerRes.value;
      },
    },
  }),
});
