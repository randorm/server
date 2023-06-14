import {
  assertChoiceField,
  assertEditor,
  assertTextField,
} from "../assert/mod.ts";
import {
  GraphQLBoolean,
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type {
  ChoiceFieldModel,
  FieldModel,
  TextFieldModel,
} from "../model/mod.ts";
import { FieldTypeModel } from "../model/mod.ts";
import { FieldNode } from "../node/mod.ts";
import type { Operation } from "../types.ts";
import { asyncMap } from "../util/mod.ts";

export const FieldQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    field: {
      type: new GraphQLNonNull(FieldNode),
      args: {
        fieldId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { fieldId }, { kv }) {
        const res = await kv.get<FieldModel>(["field", fieldId]);

        if (res.value === null) {
          throw new GraphQLError(`Field with ID ${fieldId} not found`);
        }

        return res.value;
      },
    },
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }) {
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
          new GraphQLNonNull(FieldNode),
        ),
      ),
      async resolve(_root, _args, { kv }) {
        const iter = kv.list<FieldModel>({ prefix: ["field"] });

        return await asyncMap(({ value }) => value, iter);
      },
    },
  },
});

export const FieldMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createTextField: {
      type: new GraphQLNonNull(FieldNode),
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
        { format = null, sample = null, ...args },
        { user, kv },
      ) {
        assertEditor(user);

        const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

        if (nextRes.value === null) {
          throw new GraphQLError("Next Field ID not found");
        }

        const field: TextFieldModel = {
          id: Number(nextRes.value),
          type: FieldTypeModel.TEXT,
          creatorId: user.id,
          ...args,
          format,
          sample,
          createdAt: new Date(),
        };

        assertTextField(field);

        const commitRes = await kv.atomic()
          .check(nextRes)
          .set(["field", field.id], field)
          .set(["field:answer_count", field.id], 0n)
          .sum(["field_count"], 1n)
          .sum(["field_next_id"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Field");
        }

        return field;
      },
    },
    createChoiceField: {
      type: new GraphQLNonNull(FieldNode),
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
      async resolve(_root, args, { user, kv }) {
        assertEditor(user);

        const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

        if (nextRes.value === null) {
          throw new GraphQLError("Next Field ID not found");
        }

        const field: ChoiceFieldModel = {
          id: Number(nextRes.value),
          type: FieldTypeModel.CHOICE,
          creatorId: user.id,
          ...args,
          createdAt: new Date(),
        };

        assertChoiceField(field);

        const commitRes = await kv.atomic()
          .check(nextRes)
          .set(["field", field.id], field)
          .set(["field:answer_count", field.id], 0n)
          .sum(["field_count"], 1n)
          .sum(["field_next_id"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Field");
        }

        return field;
      },
    },
  },
});
