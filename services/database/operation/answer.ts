import { GraphQLError } from "../../../deps.ts";
import type { ServerContext, UserContext } from "../../../types.ts";
import { amap } from "../../../utils/mod.ts";
import type {
  SetChoiceAnswerUpdateModel,
  SetTextAnswerUpdateModel,
} from "../../graphql/update/mod.ts";
import { assertChoiceAnswer, assertTextAnswer } from "../assert/mod.ts";
import type {
  AnswerModel,
  ChoiceAnswerModel,
  FieldModel,
  TextAnswerModel,
} from "../model/mod.ts";
import { FieldType } from "../model/mod.ts";

export async function answer(
  { kv }: ServerContext,
  { fieldId, respondentId }: { fieldId: number; respondentId: number },
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
}

export async function answerCount(
  { kv }: ServerContext,
  { fieldId }: { fieldId: number },
): Promise<number> {
  const res = await kv.get<Deno.KvU64>(["field:answer_count", fieldId]);

  if (res.value === null) {
    throw new GraphQLError(
      `Answer count to Field with ID ${fieldId} not found`,
    );
  }

  return Number(res.value);
}

export async function answers(
  { kv }: ServerContext,
  { fieldId }: { fieldId: number },
): Promise<AnswerModel[]> {
  const iter = kv.list<AnswerModel>({ prefix: ["answer", fieldId] });

  return await amap(({ value }) => value, iter);
}

export async function setTextAnswer(
  { user, kv }: UserContext,
  { fieldId, value }: { fieldId: number; value: string },
): Promise<SetTextAnswerUpdateModel> {
  const [
    fieldRes,
    answerRes,
  ] = await kv.getMany<[FieldModel, TextAnswerModel]>([
    ["field", fieldId],
    ["answer", fieldId, user.id],
  ]);

  if (fieldRes.value === null) {
    throw new GraphQLError(`Field with ID ${fieldId} not found`);
  }

  if (fieldRes.value.type !== FieldType.TEXT) {
    throw new GraphQLError(
      `Field with ID ${fieldRes.value.id} is not a TextField`,
    );
  }

  if (answerRes.value === null) {
    const fieldIdsRes = await kv.get<Set<number>>([
      "user:field_ids",
      user.id,
    ]);

    if (fieldIdsRes.value === null) {
      throw new GraphQLError(
        `Field IDs of User with ID ${user.id} not found`,
      );
    }

    const answer: TextAnswerModel = {
      fieldId,
      respondentId: user.id,
      type: FieldType.TEXT,
      value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    assertTextAnswer(answer, fieldRes.value);

    const operation = kv.atomic()
      .check(answerRes)
      .set(["answer", fieldId, user.id], answer)
      .sum(["field:answer_count", fieldId], 1n);

    if (!fieldIdsRes.value.has(fieldId)) {
      const fieldIds = new Set<number>([...fieldIdsRes.value, fieldId]);

      operation
        .check(fieldIdsRes)
        .set(["user:field_ids", user.id], fieldIds)
        .sum(["user:field_count", fieldId], 1n);
    }

    const commitRes = await operation.commit();

    if (!commitRes.ok) {
      throw new GraphQLError("Failed to create TextAnswer");
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
      `Failed to update TextAnswer to TextField with ID ${fieldId} from User with ID ${user.id}`,
    );
  }

  return { user, answer: answerUpdate, field: fieldRes.value };
}

export async function setChoiceAnswer(
  { user, kv }: UserContext,
  { fieldId, indices }: { fieldId: number; indices: readonly number[] },
): Promise<SetChoiceAnswerUpdateModel> {
  const [
    fieldRes,
    answerRes,
  ] = await kv.getMany<[FieldModel, ChoiceAnswerModel]>([
    ["field", fieldId],
    ["answer", fieldId, user.id],
  ]);

  if (fieldRes.value === null) {
    throw new GraphQLError(`Field with ID ${fieldId} not found`);
  }

  if (fieldRes.value.type !== FieldType.CHOICE) {
    throw new GraphQLError(
      `Field with ID ${fieldRes.value.id} is not a ChoiceField`,
    );
  }

  if (answerRes.value === null) {
    const fieldIdsRes = await kv.get<Set<number>>([
      "user:field_ids",
      user.id,
    ]);

    if (fieldIdsRes.value === null) {
      throw new GraphQLError(
        `Field IDs of User with ID ${user.id} not found`,
      );
    }

    const answer: ChoiceAnswerModel = {
      fieldId,
      respondentId: user.id,
      type: FieldType.CHOICE,
      indices: new Set(indices),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    assertChoiceAnswer(answer, fieldRes.value);

    const operation = kv.atomic()
      .check(answerRes)
      .set(["answer", fieldId, user.id], answer)
      .sum(["field:answer_count", fieldId], 1n);

    if (!fieldIdsRes.value.has(fieldId)) {
      const fieldIds = new Set<number>([...fieldIdsRes.value, fieldId]);

      operation
        .check(fieldIdsRes)
        .set(["user:field_ids", user.id], fieldIds)
        .sum(["user:field_count", fieldId], 1n);
    }

    const commitRes = await operation.commit();

    if (!commitRes.ok) {
      throw new GraphQLError("Failed to create ChoiceAnswer");
    }

    return { user, answer, field: fieldRes.value };
  }

  const answerUpdate: ChoiceAnswerModel = {
    ...answerRes.value,
    indices: new Set(indices),
    updatedAt: new Date(),
  };

  assertChoiceAnswer(answerUpdate, fieldRes.value);

  const commitRes = await kv.atomic()
    .check(answerRes)
    .set(["answer", fieldId, user.id], answerUpdate)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError(
      `Failed to update ChoiceAnswer to ChoiceField with ID ${fieldId} from User with ID ${user.id}`,
    );
  }

  return { user, answer: answerUpdate, field: fieldRes.value };
}
