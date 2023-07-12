import { GraphQLError } from "../../../deps.ts";
import type { ServerContext, UserContext } from "../../../types.ts";
import { amap } from "../../../utils/mod.ts";
import {
  assertChoiceField,
  assertEditor,
  assertTextField,
} from "../assert/mod.ts";
import type {
  ChoiceFieldModel,
  FieldModel,
  TextFieldModel,
} from "../model/mod.ts";
import { FieldType } from "../model/mod.ts";

export async function field(
  { kv }: ServerContext,
  { fieldId }: { fieldId: number },
): Promise<FieldModel> {
  const res = await kv.get<FieldModel>(["field", fieldId]);

  if (res.value === null) {
    throw new GraphQLError(`Field with ID ${fieldId} not found`);
  }

  return res.value;
}

export async function fieldCount({ kv }: ServerContext): Promise<number> {
  const res = await kv.get<Deno.KvU64>(["field_count"]);

  if (res.value === null) {
    throw new GraphQLError("Field count not found");
  }

  return Number(res.value);
}

export async function fields({ kv }: ServerContext): Promise<FieldModel[]> {
  const iter = kv.list<FieldModel>({ prefix: ["field"] });

  return await amap(({ value }) => value, iter);
}

export async function createTextField(
  { user, kv }: UserContext,
  args: Pick<TextFieldModel, "required" | "question" | "format" | "sample">,
): Promise<TextFieldModel> {
  assertEditor(user);

  const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

  if (nextRes.value === null) {
    throw new GraphQLError("Next Field ID not found");
  }

  const field: TextFieldModel = {
    id: Number(nextRes.value),
    type: FieldType.TEXT,
    creatorId: user.id,
    ...args,
    createdAt: new Date(),
  };

  assertTextField(field);

  const commitRes = await kv.atomic()
    .set(["field", field.id], field)
    .set(["field:answer_count", field.id], new Deno.KvU64(0n))
    .sum(["field_count"], 1n)
    .sum(["field_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create TextField");
  }

  return field;
}

export async function createChoiceField(
  { user, kv }: UserContext,
  args: Pick<
    ChoiceFieldModel,
    "required" | "question" | "multiple" | "options"
  >,
): Promise<ChoiceFieldModel> {
  assertEditor(user);

  const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

  if (nextRes.value === null) {
    throw new GraphQLError("Next Field ID not found");
  }

  const field: ChoiceFieldModel = {
    id: Number(nextRes.value),
    type: FieldType.CHOICE,
    creatorId: user.id,
    ...args,
    createdAt: new Date(),
  };

  assertChoiceField(field);

  const commitRes = await kv.atomic()
    .set(["field", field.id], field)
    .set(["field:answer_count", field.id], new Deno.KvU64(0n))
    .sum(["field_count"], 1n)
    .sum(["field_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create ChoiceField");
  }

  return field;
}
