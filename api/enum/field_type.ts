import { GraphQLEnumType } from "../deps.ts";

export const FieldTypeEnum = new GraphQLEnumType({
  name: "FieldType",
  values: {
    TEXT: {
      value: "text",
    },
    CHOICE: {
      value: "choice",
    },
  },
});
