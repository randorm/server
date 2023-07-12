import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../../../deps.ts";
import { assertAuthenticated } from "../../database/assert/mod.ts";
import type { AnswerModel } from "../../database/model/mod.ts";
import {
  answer,
  answerCount,
  answers,
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
        args: { fieldId: number; respondentId: number },
        context,
      ): Promise<AnswerModel> {
        return await answer(context, args);
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
        args: { fieldId: number },
        context,
      ): Promise<number> {
        return await answerCount(context, args);
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
        args: { fieldId: number },
        context,
      ): Promise<AnswerModel[]> {
        return await answers(context, args);
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
