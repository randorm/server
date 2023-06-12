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
  fields: () => ({
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

        return res.value === null ? 0 : Number(res.value);
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
  }),
});

export const FieldMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
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

        const countRes = await kv.get<Deno.KvU64>(["field_count"]);

        const field: TextFieldModel = {
          id: countRes.value === null ? 0 : Number(countRes.value),
          type: FieldTypeModel.TEXT,
          creatorId: user.id,
          ...args,
          format,
          sample,
          createdAt: new Date(),
        };

        assertTextField(field);

        const commitRes = await kv.atomic()
          .check(countRes)
          .set(["field", field.id], field)
          .sum(["field_count"], 1n)
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

        const countRes = await kv.get<Deno.KvU64>(["field_count"]);

        const field: ChoiceFieldModel = {
          id: countRes.value === null ? 0 : Number(countRes.value),
          type: FieldTypeModel.CHOICE,
          creatorId: user.id,
          ...args,
          createdAt: new Date(),
        };

        assertChoiceField(field);

        const commitRes = await kv.atomic()
          .check(countRes)
          .set(["field", field.id], field)
          .sum(["field_count"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Field");
        }

        return field;
      },
    },
  }),
});
