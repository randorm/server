import { GraphQLError } from "../../../deps.ts";
import type { UserContext } from "../../../types.ts";
import {
  assertChoiceField,
  assertEditor,
  assertTextField,
} from "../assert/mod.ts";
import type { ChoiceFieldModel, TextFieldModel } from "../model/mod.ts";
import { FieldType } from "../model/mod.ts";

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
