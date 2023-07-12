import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../../../deps.ts";
import { assertAuthenticated } from "../../database/assert/mod.ts";
import type {
  ChoiceFieldModel,
  FieldModel,
  TextFieldModel,
} from "../../database/model/mod.ts";
import {
  createChoiceField,
  createTextField,
  field,
  fieldCount,
  fields,
} from "../../database/operation/mod.ts";
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
        args: { fieldId: number },
        context,
      ): Promise<FieldModel> {
        return await field(context, args);
      },
    },
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, context): Promise<number> {
        return await fieldCount(context);
      },
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldInterface),
        ),
      ),
      async resolve(_root, _args, context): Promise<FieldModel[]> {
        return await fields(context);
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
        context,
      ): Promise<TextFieldModel> {
        assertAuthenticated(context);

        return await createTextField(context, { format, sample, ...args });
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
        context,
      ): Promise<ChoiceFieldModel> {
        assertAuthenticated(context);

        return await createChoiceField(context, args);
      },
    },
  },
});
