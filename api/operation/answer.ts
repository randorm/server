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
import { AnswerNode } from "../node/mod.ts";
import type { Operation } from "../types.ts";
import { assertChoiceAnswer, assertTextAnswer } from "../util/mod.ts";

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
          "field",
          fieldId,
          "answer",
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
        const res = await kv.get<Deno.KvU64>([
          "field",
          fieldId,
          "answer_count",
        ]);

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
        const iter = kv.list<AnswerModel>({
          prefix: ["field", fieldId, "answer"],
        });

        const answers = [];
        for await (const { value } of iter) answers.push(value);

        return answers;
      },
    },
  }),
});

export const AnswerMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    createTextAnswer: {
      type: new GraphQLNonNull(AnswerNode),
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

        const answerRes = await kv.get<TextAnswerModel>([
          "field",
          fieldId,
          "answer",
          user.id,
        ]);

        if (answerRes.value !== null) {
          throw new GraphQLError(
            `Answer to Field with ID ${fieldId} from User with ID ${user.id} already exists`,
          );
        }

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
          .set(["field", fieldId, "answer", user.id], answer)
          .sum(["field", fieldId, "answer_count"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Answer");
        }

        return answer;
      },
    },
    createChoiceAnswer: {
      type: new GraphQLNonNull(AnswerNode),
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

        const answerRes = await kv.get<ChoiceAnswerModel>([
          "field",
          fieldId,
          "answer",
          user.id,
        ]);

        if (answerRes.value !== null) {
          throw new GraphQLError(
            `Answer to Field with ID ${fieldId} from User with ID ${user.id} already exists`,
          );
        }

        const answer: ChoiceAnswerModel = {
          fieldId,
          respondentId: user.id,
          type: FieldTypeModel.CHOICE,
          value: new Set(value),
          creadtedAt: new Date(),
          updatedAt: new Date(),
        };

        assertChoiceAnswer(answer, fieldRes.value);

        const commitRes = await kv.atomic()
          .check(answerRes)
          .set(["field", fieldId, "answer", user.id], answer)
          .sum(["field", fieldId, "answer_count"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Answer");
        }

        return answer;
      },
    },
    updateTextAnswer: {
      type: new GraphQLNonNull(AnswerNode),
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

        const answerRes = await kv.get<TextAnswerModel>([
          "field",
          fieldId,
          "answer",
          user.id,
        ]);

        if (answerRes.value === null) {
          throw new GraphQLError(
            `Answer to Field with ID ${fieldId} from User with ID ${user.id} not found`,
          );
        }

        const answer: TextAnswerModel = {
          ...answerRes.value,
          value,
          updatedAt: new Date(),
        };

        assertTextAnswer(answer, fieldRes.value);

        const commitRes = await kv.atomic()
          .check(answerRes)
          .set(["field", fieldId, "answer", user.id], answer)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update Answer to Field with ID ${fieldId} from User with ID ${user.id}`,
          );
        }

        return answer;
      },
    },
    updateChoiceAnswer: {
      type: new GraphQLNonNull(AnswerNode),
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

        const answerRes = await kv.get<ChoiceAnswerModel>([
          "field",
          fieldId,
          "answer",
          user.id,
        ]);

        if (answerRes.value === null) {
          throw new GraphQLError(
            `Answer to Field with ID ${fieldId} from User with ID ${user.id} not found`,
          );
        }

        const answer: ChoiceAnswerModel = {
          ...answerRes.value,
          value: new Set(value),
          updatedAt: new Date(),
        };

        assertChoiceAnswer(answer, fieldRes.value);

        const commitRes = await kv.atomic()
          .check(answerRes)
          .set(["field", fieldId, "answer", user.id], answer)
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
          "field",
          fieldId,
          "answer",
          user.id,
        ]);

        if (answerRes.value === null) {
          throw new GraphQLError(
            `Answer to Field with ID ${fieldId} from User with ID ${user.id} not found`,
          );
        }

        const commitRes = await kv.atomic()
          .check(answerRes)
          .delete(["field", fieldId, "answer", user.id])
          .sum(["field", fieldId, "answer_count"], -1n)
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
