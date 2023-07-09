import {
  GraphQLBoolean,
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../../../deps.ts";
import { amap } from "../../../utils/mod.ts";
import {
  assertChoiceField,
  assertEditor,
  assertTextField,
} from "../../database/assert/mod.ts";
import type {
  ChoiceFieldModel,
  FieldModel,
  TextFieldModel,
} from "../../database/model/mod.ts";
import { FieldType } from "../../database/model/mod.ts";
import { ChoiceFieldNode, FieldInterface, TextFieldNode } from "../type/mod.ts";
import type { Operation } from "../types.ts";

export const FieldQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    field: {
      type: new GraphQLNonNull(FieldInterface),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        { fieldId }: { fieldId: number },
        { kv },
      ): Promise<FieldModel> {
        const res = await kv.get<FieldModel>(["field", fieldId]);

        if (res.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        return res.value;
      },
    },
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }): Promise<number> {
        const res = await kv.get<Deno.KvU64>(["field_count"]);

        if (res.value === null) {
          throw new GraphQLError("Field count not found");
        }

        return Number(res.value);
      },
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldInterface),
        ),
      ),
      async resolve(_root, _args, { kv }): Promise<FieldModel[]> {
        const iter = kv.list<FieldModel>({ prefix: ["field"] });

        return await amap(({ value }) => value, iter);
      },
    },
  },
});

export const FieldMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createTextField: {
      type: new GraphQLNonNull(TextFieldNode),
      args: {
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
      },
      async resolve(
        _root,
        { format = null, sample = null, ...args }: Pick<
          TextFieldModel,
          "required" | "question" | "format" | "sample"
        >,
        { user, kv },
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
          format,
          sample,
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
      },
    },
    createChoiceField: {
      type: new GraphQLNonNull(ChoiceFieldNode),
      args: {
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
      },
      async resolve(
        _root,
        args: Pick<
          ChoiceFieldModel,
          "required" | "question" | "multiple" | "options"
        >,
        { user, kv },
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
      },
    },
  },
});
