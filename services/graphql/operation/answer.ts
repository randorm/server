import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../../../deps.ts";
import { amap } from "../../../utils/mod.ts";
import { assertAuthenticated } from "../../database/assert/mod.ts";
import type { AnswerModel } from "../../database/model/mod.ts";
import {
  setChoiceAnswer,
  setTextAnswer,
} from "../../database/operation/mod.ts";
import { AnswerInterface } from "../type/mod.ts";
import type { Operation } from "../types.ts";
import type {
  SetChoiceAnswerUpdateModel,
  SetTextAnswerUpdateModel,
} from "../update/mod.ts";
import { SetChoiceAnswerUpdate, SetTextAnswerUpdate } from "../update/mod.ts";

export const AnswerQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    answer: {
      type: new GraphQLNonNull(AnswerInterface),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        respondentId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        { fieldId, respondentId }: { fieldId: number; respondentId: number },
        { kv },
      ): Promise<AnswerModel> {
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
      async resolve(
        _root,
        { fieldId }: { fieldId: number },
        { kv },
      ): Promise<number> {
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
          new GraphQLNonNull(AnswerInterface),
        ),
      ),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        { fieldId }: { fieldId: number },
        { kv },
      ): Promise<AnswerModel[]> {
        const iter = kv.list<AnswerModel>({ prefix: ["answer", fieldId] });

        return await amap(({ value }) => value, iter);
      },
    },
  },
});

export const AnswerMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    setTextAnswer: {
      type: new GraphQLNonNull(SetTextAnswerUpdate),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        value: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(
        _root,
        args: { fieldId: number; value: string },
        context,
      ): Promise<SetTextAnswerUpdateModel> {
        assertAuthenticated(context);

        return await setTextAnswer(context, args);
      },
    },
    setChoiceAnswer: {
      type: new GraphQLNonNull(SetChoiceAnswerUpdate),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        indices: {
          type: new GraphQLNonNull(
            new GraphQLList(
              new GraphQLNonNull(GraphQLInt),
            ),
          ),
        },
      },
      async resolve(
        _root,
        args: { fieldId: number; indices: readonly number[] },
        context,
      ): Promise<SetChoiceAnswerUpdateModel> {
        assertAuthenticated(context);

        return await setChoiceAnswer(context, args);
      },
    },
  },
});
